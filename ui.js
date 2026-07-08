const INPUT_IDS = [
    'weight', 'diameter', 'dragCoeff', 'liftCoeff',
    'angle', 'velocity', 'yawAngle', 'launchHeight', 'launchZ',
    'windX', 'windY', 'targetHeight', 'airDensity',
    'losTargetY', 'losTargetZ'
];

function saveSettings() {
    INPUT_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) localStorage.setItem('arrow_sim_' + id, el.value);
    });
    const useLosEl = document.getElementById('useLos');
    if (useLosEl) localStorage.setItem('arrow_sim_useLos', useLosEl.checked ? 'true' : 'false');
}

function loadSettings() {
    INPUT_IDS.forEach(id => {
        const savedValue = localStorage.getItem('arrow_sim_' + id);
        const el = document.getElementById(id);
        if (el && savedValue !== null) {
            el.value = savedValue;
        }
    });
    const useLosEl = document.getElementById('useLos');
    const savedLos = localStorage.getItem('arrow_sim_useLos');
    if (useLosEl && savedLos !== null) useLosEl.checked = (savedLos === 'true');
}

// 💡 슬라이딩 연동을 위해 수정된 switchPanel 함수
function switchPanel(type) {
    saveSettings();
    
    // 하단 쫀득한 슬라이더 위치 강제 이동 연동
    if (typeof window.updatePanelPositionByTab === 'function') {
        window.updatePanelPositionByTab(type);
    }
    
    updateTabActiveStyle(type);
    if (typeof drawScene === 'function') drawScene();
}

function updateTabActiveStyle(type) {
    const tabItems = document.querySelectorAll('.tab-bar .tab-item');
    tabItems.forEach(item => item.classList.remove('active'));
    const typeOrder = ['arrow', 'method', 'env', 'result'];
    const activeIndex = typeOrder.indexOf(type);
    if (activeIndex !== -1 && tabItems[activeIndex]) {
        tabItems[activeIndex].classList.add('active');
    }
}

let currentView = 'side';
function changeView(viewType, element) {
    const buttons = document.querySelectorAll('.segmented-control .segment-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');
    currentView = viewType;
    if (typeof drawScene === 'function') drawScene();
}

const NEGATIVE_ALLOWED_IDS = ['angle', 'yawAngle', 'windX', 'windY', 'targetHeight', 'losTargetY', 'losTargetZ'];

window.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    const useLosEl = document.getElementById('useLos');
    if (useLosEl) {
        useLosEl.addEventListener('change', () => {
            if (typeof saveSettings === 'function') saveSettings();
            if (typeof drawScene === 'function') drawScene();
        });
    }

    INPUT_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                if (NEGATIVE_ALLOWED_IDS.includes(id)) {
                    let val = el.value;
                    val = val.replace(/[^0-9.-]/g, '');
                    val = val.replace(/(?!^)-/g, '');
                    const parts = val.split('.');
                    if (parts.length > 2) {
                        val = parts[0] + '.' + parts.slice(1).join('');
                    }
                    el.value = val;
                }
                saveSettings();
                if (typeof drawScene === 'function') drawScene();
            });
        }
    });

    // 발시 버튼 드래그 시스템
    const dragBtn = document.getElementById('draggableFireBtn');
    if (dragBtn) {
        let isDragging = false;
        let hasMoved = false;
        let startX = 0, startY = 0;
        let initialLeft = 0, initialTop = 0;

        function loadButtonPosition() {
            const savedLeft = localStorage.getItem('arrow_sim_btn_left');
            const savedTop = localStorage.getItem('arrow_sim_btn_top');
            if (savedLeft !== null && savedTop !== null) {
                dragBtn.style.left = savedLeft;
                dragBtn.style.top = savedTop;
                dragBtn.style.right = 'auto';
            }
        }

        function startDrag(e) {
            isDragging = true;
            hasMoved = false;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = clientX;
            startY = clientY;
            const rect = dragBtn.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
        }

        function doDrag(e) {
            if (!isDragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
                hasMoved = true;
            }
            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;
            const maxLeft = window.innerWidth - dragBtn.offsetWidth;
            const maxTop = window.innerHeight - dragBtn.offsetHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));
            dragBtn.style.left = newLeft + 'px';
            dragBtn.style.top = newTop + 'px';
            dragBtn.style.right = 'auto';
        }

        function endDrag(e) {
            if (!isDragging) return;
            isDragging = false;
            if (!hasMoved) {
                if (typeof fireArrow === 'function') fireArrow();
            } else {
                localStorage.setItem('arrow_sim_btn_left', dragBtn.style.left);
                localStorage.setItem('arrow_sim_btn_top', dragBtn.style.top);
            }
        }

        loadButtonPosition();
        dragBtn.addEventListener('touchstart', startDrag, { passive: true });
        window.addEventListener('touchmove', doDrag, { passive: false });
        window.addEventListener('touchend', endDrag);
        dragBtn.addEventListener('mousedown', startDrag);
        window.addEventListener('mousemove', doDrag);
        window.addEventListener('mouseup', endDrag);
    }

    // 과녁 모드 전용 조준점 드래그 시스템
    let isTargetDragging = false;
    const simCanvasEl = document.getElementById('simCanvas');
    if (simCanvasEl) {
        simCanvasEl.addEventListener('mousedown', startTargetDrag);
        simCanvasEl.addEventListener('touchstart', startTargetDrag, { passive: false });
    }
    window.addEventListener('mousemove', doTargetDrag);
    window.addEventListener('touchmove', doTargetDrag, { passive: false });
    window.addEventListener('mouseup', endTargetDrag);
    window.addEventListener('touchend', endTargetDrag);

    function startTargetDrag(e) {
        if (typeof currentView !== 'undefined' && currentView !== 'target') return;
        if (e.touches) e.preventDefault();
        isTargetDragging = true;
        updateTargetCoords(e);
    }
    function doTargetDrag(e) {
        if (!isTargetDragging) return;
        if (typeof currentView !== 'undefined' && currentView !== 'target') return;
        if (e.touches) e.preventDefault();
        updateTargetCoords(e);
    }
    function endTargetDrag(e) { isTargetDragging = false; }

    function updateTargetCoords(e) {
        const canvasEl = document.getElementById('simCanvas');
        if (!canvasEl) return;
        const rect = canvasEl.getBoundingClientRect();
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        const currentDprWidth = canvasEl.width / (window.devicePixelRatio || 1);
        const currentDprHeight = canvasEl.height / (window.devicePixelRatio || 1);
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;
        const tBottomY = currentDprHeight * 0.75;
        const targetViewScale = Math.min(currentDprWidth, currentDprHeight) / 5.5;
        const calculatedZ = (canvasX - (currentDprWidth / 2)) / targetViewScale;
        const calculatedY = (tBottomY - canvasY) / targetViewScale;
        const losYEl = document.getElementById('losTargetY');
        const losZEl = document.getElementById('losTargetZ');
        const useLosEl = document.getElementById('useLos');

        if (losYEl && losZEl) {
            losYEl.value = calculatedY.toFixed(2);
            losZEl.value = calculatedZ.toFixed(2);
            if (useLosEl && !useLosEl.checked) useLosEl.checked = true;
            localStorage.setItem('arrow_sim_losTargetY', losYEl.value);
            localStorage.setItem('arrow_sim_losTargetZ', losZEl.value);
            localStorage.setItem('arrow_sim_useLos', 'true');
            if (typeof drawScene === 'function') window.requestAnimationFrame(drawScene);
        }
    }

    const useLosCheck = document.getElementById('useLos');
    if (useLosCheck) {
        const savedLos = localStorage.getItem('arrow_sim_useLos');
        useLosCheck.checked = (savedLos === 'true');
        useLosCheck.addEventListener('change', () => {
            localStorage.setItem('arrow_sim_useLos', useLosCheck.checked);
            if (typeof drawScene === 'function') drawScene();
        });
    }
});

function closeIntro() {
    const introModal = document.getElementById('introModal');
    if (introModal) {
        introModal.style.opacity = '0';
        introModal.style.visibility = 'hidden';
        setTimeout(() => { introModal.style.display = 'none'; }, 300);
    }
}

// =========================================================================
// 🎯 [완결본] 상단 그림(시뮬레이터) & 하단 설정 카드 양방향 쫀득한 스와이프 기능
// =========================================================================
// 1. 하단 설정 카드 전용 스와이프 로직
(function() {
    const panelContainer = document.getElementById('panel-container');
    if (!panelContainer) return;

    let touchStartX = 0, touchStartY = 0;
// =========================================================================
// 🎯 [오류 전면 수정본] 상단 그림 & 하단 설정 카드 부드러운 스와이프 기능
// =========================================================================

// 1. 하단 설정 카드 전용 스와이프 로직
(function() {
    const panelContainer = document.getElementById('panel-container');
    if (!panelContainer) return;

    let touchStartX = 0, touchStartY = 0;
    let currentTranslate = 0, prevTranslate = 0;
    let isTracking = false, isSwipingValue = false;
    
    // 💡 소괄호를 대괄호 [] 로 수정하여 정상적인 배열로 선언합니다.
    const tabsOrder = ['arrow', 'method', 'env', 'result'];
    let currentIndex = 0;

    window.updatePanelPositionByTab = function(type) {
        currentIndex = tabsOrder.indexOf(type);
        if (currentIndex === -1) currentIndex = 0;
        panelContainer.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
        currentTranslate = currentIndex * -window.innerWidth;
        prevTranslate = currentTranslate;
        
        // 💡 백틱 기호(``)를 사용하여 유효한 CSS 코드로 전달합니다.
        panelContainer.style.transform = `translateX(${currentTranslate}px)`;
    };

    panelContainer.addEventListener('touchstart', (e) => {
        if (!e.touches || e.touches.length === 0) return;
        // 💡 (0) 대신 대괄호 [0]으로 첫 번째 터치 좌표를 가져옵니다.
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isTracking = true;
        isSwipingValue = false;
        panelContainer.style.transition = 'none';
    }, { passive: true });

    panelContainer.addEventListener('touchmove', (e) => {
        if (!isTracking || !e.touches || e.touches.length === 0) return;
        // 💡 대괄호 [0] 구문 수정
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - touchStartX;
        const deltaY = currentY - touchStartY;

        if (!isSwipingValue) {
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                isSwipingValue = true;
            } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
                isTracking = false; 
            }
        }

        if (isSwipingValue) {
            let moveX = prevTranslate + deltaX;
            if (moveX > 0) moveX = deltaX * 0.3;
            const maxTranslate = (tabsOrder.length - 1) * -window.innerWidth;
            if (moveX < maxTranslate) moveX = maxTranslate + (moveX - maxTranslate) * 0.3;
            
            // 💡 백틱 기호(``) 수정
            panelContainer.style.transform = `translateX(${moveX}px)`;
        }
    }, { passive: true });

    panelContainer.addEventListener('touchend', (e) => {
        if (!isTracking) return;
        isTracking = false;
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        // 💡 대괄호 [0] 구문 수정
        const touchEndX = e.changedTouches[0].clientX;
        const deltaX = touchEndX - touchStartX;

        panelContainer.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
        const threshold = window.innerWidth * 0.2; 

        if (isSwipingValue) {
            if (deltaX < -threshold && currentIndex < tabsOrder.length - 1) {
                currentIndex++;
            } else if (deltaX > threshold && currentIndex > 0) {
                currentIndex--;
            }
        }
        // 💡 배열의 값을 가져올 때는 대괄호 []를 씁니다.
        switchPanel(tabsOrder[currentIndex]);
    }, { passive: true });
})();


// 2. 상단 그림(시뮬레이터 화면) 전용 스와이프 로직
(function() {
    const simContainer = document.querySelector('.sim-container');
    if (!simContainer) return;

    let simTouchStartX = 0, simTouchStartY = 0;
    let isSimTracking = false;
    // 💡 소괄호를 대괄호 [] 로 선언 수정
    const viewsOrder = ['front', 'side', 'top', 'target'];

    simContainer.addEventListener('touchstart', (e) => {
        if (e.target.id === 'draggableFireBtn' || currentView === 'target') return; 
        if (!e.touches || e.touches.length === 0) return;
        // 💡 대괄호 [0] 구문 수정
        simTouchStartX = e.touches[0].clientX;
        simTouchStartY = e.touches[0].clientY;
        isSimTracking = true;
    }, { passive: true });

    simContainer.addEventListener('touchend', (e) => {
        if (!isSimTracking || !e.changedTouches || e.changedTouches.length === 0) return;
        isSimTracking = false;

        // 💡 대괄호 [0] 구문 수정
        const simTouchEndX = e.changedTouches[0].clientX;
        const simTouchEndY = e.changedTouches[0].clientY;
        const deltaX = simTouchEndX - simTouchStartX;
        const deltaY = simTouchEndY - simTouchStartY;

        if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (typeof currentView === 'undefined') return;
            const currentIndex = viewsOrder.indexOf(currentView);
            let targetView = '';

            if (deltaX < 0 && currentIndex < viewsOrder.length - 1) {
                // 💡 배열 순서 가져오기는 대괄호 [] 
                targetView = viewsOrder[currentIndex + 1]; 
            } else if (deltaX > 0 && currentIndex > 0) {
                // 💡 배열 순서 가져오기는 대괄호 []
                targetView = viewsOrder[currentIndex - 1]; 
            }

            if (targetView) {
                const btnSelector = `.segmented-control .segment-btn[onclick*="${targetView}"]`;
                const targetBtnEl = document.querySelector(btnSelector);
                changeView(targetView, targetBtnEl);
            }
        }
    }, { passive: true });
})();
