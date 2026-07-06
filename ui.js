const INPUT_IDS = [
  'weight', 'diameter', 'dragCoeff', 'liftCoeff',
  'angle', 'velocity', 'yawAngle', 'launchHeight', 'launchZ',
  'windX', 'windY', 'targetHeight', 'airDensity',
  'losTargetY', 'losTargetZ' // 💡 LOS 수동 입력 ID 추가 (useLos는 체크박스이므로 별도 처리하거나 제외)
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

function switchPanel(type) {
  saveSettings();
  const panels = ['arrow', 'method', 'env', 'result'];
  panels.forEach(p => {
    const el = document.getElementById('panel-' + p);
    if (el) el.classList.remove('active');
  });

  const targetPanel = document.getElementById('panel-' + type);
  if (targetPanel) {
    targetPanel.classList.add('active');
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

  // =========================================================================
  // [💡 위치 기억 기능 추가] 무제한 스크린 프리 드래그 제어 시스템
  // =========================================================================
  const dragBtn = document.getElementById('draggableFireBtn');
  if (!dragBtn) return;

  let isDragging = false;
  let hasMoved = false;
  let startX = 0, startY = 0;
  let initialLeft = 0, initialTop = 0;

  // 이전 사용 위치 복원 함수
  function loadButtonPosition() {
    const savedLeft = localStorage.getItem('arrow_sim_btn_left');
    const savedTop = localStorage.getItem('arrow_sim_btn_top');
    
    if (savedLeft !== null && savedTop !== null) {
      dragBtn.style.left = savedLeft;
      dragBtn.style.top = savedTop;
      dragBtn.style.right = 'auto'; // 초기 CSS 우측 고정 해제
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

    // 브라우저 뷰포트 전체 크기를 기준으로 가둠
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
      // 드래그 이동이 정상적으로 완료되면 로컬스토리지에 위치 좌표 저장
      localStorage.setItem('arrow_sim_btn_left', dragBtn.style.left);
      localStorage.setItem('arrow_sim_btn_top', dragBtn.style.top);
    }
  }

  // 초기 실행 시 저장된 버튼 위치 불러오기
  loadButtonPosition();

  // 이벤트 리스너 등록
  dragBtn.addEventListener('touchstart', startDrag, { passive: true });
  window.addEventListener('touchmove', doDrag, { passive: false });
  window.addEventListener('touchend', endDrag);
  dragBtn.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', doDrag);
  window.addEventListener('mouseup', endDrag);
 
  const useLosCheck = document.getElementById('useLos');
  if (useLosCheck) {
    // 로컬스토리지에서 기존 상태 복원
    const savedLos = localStorage.getItem('arrow_sim_useLos');
    useLosCheck.checked = (savedLos === 'true');

    // 변경될 때마다 저장하고 화면 리드로우
    useLosCheck.addEventListener('change', () => {
      localStorage.setItem('arrow_sim_useLos', useLosCheck.checked);
      if (typeof drawScene === 'function') drawScene();
    });
  }  
  
});
// 인트로 공지사항 모달 닫기 함수
function closeIntro() {
  const introModal = document.getElementById('introModal');
  if (introModal) {
    introModal.style.opacity = '0';
    introModal.style.visibility = 'hidden';
    setTimeout(() => {
      introModal.style.display = 'none';
    }, 300); // CSS transition 시간(0.3s)과 일치시켜 부드럽게 제거
  }
}

// =========================================================
// 🎯 과녁도 표보기 조준점 실시간 터치/마우스 드래그 제어 시스템
// =========================================================
let isTargetDragging = false;

// 1. 드래그 시작 이벤트 연동
canvas.addEventListener('mousedown', startTargetDrag);
canvas.addEventListener('touchstart', startTargetDrag, { passive: false });

// 2. 글로벌 움직임 및 종료 이벤트 연동 (윈도우 전역에서 추적해야 끊김이 없습니다)
window.addEventListener('mousemove', doTargetDrag);
window.addEventListener('touchmove', doTargetDrag, { passive: false });
window.addEventListener('mouseup', endTargetDrag);
window.addEventListener('touchend', endTargetDrag);

// 드래그 시작 핸들러
function startTargetDrag(e) {
    if (currentView !== 'target') return;
    
    // 모바일 터치 시 브라우저 스크롤 및 팅김 현상 방지
    if (e.touches) e.preventDefault();
    
    isTargetDragging = true;
    updateTargetCoords(e);
}

// 드래그 중 핸들러
function doTargetDrag(e) {
    if (!isTargetDragging || currentView !== 'target') return;
    if (e.touches) e.preventDefault(); // 드래그 중 화면 스크롤 차단
    
    updateTargetCoords(e);
}

// 드래그 종료 핸들러
function endTargetDrag(e) {
    if (isTargetDragging) {
        isTargetDragging = false;
    }
}

// 좌표 연산 및 화면 갱신 핵심 함수
function updateTargetCoords(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    // Canvas 내부 순수 CSS 픽셀 좌표 계산
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    
    // physics.js 스케일 레이아웃과 완전 동기화
    const tBottomY = dprHeight * 0.65;
    const targetViewScale = Math.min(dprWidth, dprHeight) / 5.5;
    
    // 화면 픽셀로부터 실제 월드 공간(Z, Y) 단위 미터값 역산
    const calculatedZ = (canvasX - (dprWidth / 2)) / targetViewScale;
    const calculatedY = (tBottomY - canvasY) / targetViewScale;
    
    const losYEl = document.getElementById('losTargetY');
    const losZEl = document.getElementById('losTargetZ');
    const useLosEl = document.getElementById('useLos');
    
    if (losYEl && losZEl) {
        // 소수점 둘째 자리까지 제한하여 입력창 값 동기화
        losYEl.value = calculatedY.toFixed(2);
        losZEl.value = calculatedZ.toFixed(2);
        
        // 표보기 사용 체크박스 강제 활성화 및 저장
        if (useLosEl && !useLosEl.checked) {
            useLosEl.checked = true;
            localStorage.setItem('arrow_sim_useLos', 'true');
        }
        
        // [중요] 변경된 값을 브라우저 시스템에 전파하여 로컬스토리지 백업 트리거 작동
        const intTrigger = new Event('input', { bubbles: true });
        losYEl.dispatchEvent(intTrigger);
        losZEl.dispatchEvent(intTrigger);

        // 실시간 물리 도면 강제 리드로우
        if (typeof saveSettings === 'function') saveSettings();
        if (typeof drawScene === 'function') drawScene();
    }
}
