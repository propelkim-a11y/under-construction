const INPUT_IDS = [
  'weight', 'diameter', 'dragCoeff', 'liftCoeff',
  'angle', 'velocity', 'yawAngle', 'launchHeight',
  'windX', 'windY', 'targetHeight', 'airDensity'
];

function saveSettings() {
  INPUT_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) localStorage.setItem('arrow_sim_' + id, el.value);
  });
}

function loadSettings() {
  INPUT_IDS.forEach(id => {
    const savedValue = localStorage.getItem('arrow_sim_' + id);
    const el = document.getElementById(id);
    if (el && savedValue !== null) {
      el.value = savedValue;
    }
  });
}

function switchPanel(type) {
  // 패널이 전환되기 전, 현재 입력된 값들을 로컬스토리지에 안전하게 저장합니다.
  if (typeof saveSettings === 'function') saveSettings();
  
  const track = document.getElementById('panelTrack');
  const targetIndex = panelOrder.indexOf(type); // ['arrow', 'method', 'env', 'result'] 중 몇 번째인지 계산
  
  if (track && targetIndex !== -1) {
    // 💡 핵심: 4개의 패널이 가로로 늘어서 있으므로, 인덱스에 따라 -25%씩 옆으로 미끄러지듯 이동합니다.
    // 0번째(화살): 0%, 1번째(사법): -25%, 2번째(환경): -50%, 3번째(결과): -75%
    const moveX = -(targetIndex * 25);
    track.style.transform = `translateX(${moveX}%)`;
    
    // 기존 CSS나 기능들과의 호환성을 위해 active 클래스도 함께 갱신해 줍니다.
    panelOrder.forEach(p => {
      const el = document.getElementById('panel-' + p);
      if (el) el.classList.remove('active');
    });
    const targetPanel = document.getElementById('panel-' + type);
    if (targetPanel) targetPanel.classList.add('active');
  }
  
  // 하단 탭 메뉴 버튼의 활성화 불빛(파란색)을 옮겨줍니다.
  updateTabActiveStyle(type);
  
  // 시뮬레이터 화면 격자를 다시 그려줍니다.
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

const NEGATIVE_ALLOWED_IDS = ['angle', 'yawAngle', 'windX', 'windY', 'targetHeight'];

window.addEventListener('DOMContentLoaded', () => {
  loadSettings();
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
  // 💡 [추가] 하단 설정판 영역을 손가락으로 밀었을 때 반응하는 터치 이벤트입니다.
  const panelContainer = document.getElementById('panel-container');
  if (panelContainer) {
    let touchStartX = 0;
    let touchStartY = 0;
    const SWIPE_THRESHOLD = 40; // 손가락을 최소 40픽셀 이상 밀었을 때만 페이지 전환으로 인정

    // 사용자가 손가락을 화면에 대는 순간의 X, Y 좌표를 기억합니다.
    panelContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    // 사용자가 손가락을 떼는 순간 전환 여부를 계산합니다.
    panelContainer.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const diffX = touchEndX - touchStartX; // 가로 움직임 거리
      const diffY = touchEndY - touchStartY; // 세로 움직임 거리

      // 중요: 수직 스크롤(위아래로 창을 내리는 행위)을 하려던 것인지, 좌우 슬라이드를 하려던 것인지 판정합니다.
      // 가로로 움직인 거리가 세로보다 크고, 최소 기준치(40px)를 넘었을 때만 실행합니다.
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > SWIPE_THRESHOLD) {
        
        // 현재 활성화되어 있는 패널의 종류를 알아냅니다.
        const currentActivePanel = document.querySelector('.fixed-panel.active') || document.getElementById('panel-arrow');
        if (!currentActivePanel) return;
        
        const currentType = currentActivePanel.id.replace('panel-', ''); // 'panel-arrow' -> 'arrow'
        const currentIndex = panelOrder.indexOf(currentType);
        
        if (currentIndex === -1) return;

        if (diffX < 0) {
          // ◀ 손가락을 왼쪽으로 쓸었을 때 = 다음(오른쪽) 패널로 이동
          if (currentIndex < panelOrder.length - 1) {
            switchPanel(panelOrder[currentIndex + 1]);
          }
        } else {
          // ▶ 손가락을 오른쪽으로 쓸었을 때 = 이전(왼쪽) 패널로 이동
          if (currentIndex > 0) {
            switchPanel(panelOrder[currentIndex - 1]);
          }
        }
      }
    }, { passive: true });
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
// =========================================================================
// [기능 추가] 설정 패널 좌우 터치 슬라이딩(스와이프) 제어 시스템
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
  const panelContainer = document.getElementById('panel-container');
  if (!panelContainer) return;

  // 패널 순서 배열 정의
  const panelOrder = ['arrow', 'method', 'env', 'result'];
  
  let touchStartX = 0;
  let touchStartY = 0;
  const SWIPE_THRESHOLD = 50; // 스와이프로 인정할 최소 픽셀 거리

  // 터치 시작 이벤트 탐지
  panelContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  // 터치 종료 이벤트 탐지 및 슬라이딩 판정
  panelContainer.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // 수직 스크롤(요소 내부 상하 스크롤) 방해를 줄이기 위해 대각선/수평 움직임 비율 체크
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > SWIPE_THRESHOLD) {
      // 현재 활성화된 패널의 ID(panel-xxx 형태에서 뒤쪽 이름만 추출) 찾기
      const currentActivePanel = document.querySelector('.fixed-panel.active');
      if (!currentActivePanel) return;
      
      const currentType = currentActivePanel.id.replace('panel-', '');
      const currentIndex = panelOrder.indexOf(currentType);
      
      if (currentIndex === -1) return;

      if (diffX < 0) {
        // ◀ 왼쪽으로 쓸기 (오른쪽 패널로 이동)
        if (currentIndex < panelOrder.length - 1) {
          switchPanel(panelOrder[currentIndex + 1]);
        }
      } else {
        // ▶ 오른쪽으로 쓸기 (왼쪽 패널로 이동)
        if (currentIndex > 0) {
          switchPanel(panelOrder[currentIndex - 1]);
        }
      }
    }
  }, { passive: true });
});
