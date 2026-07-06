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

 // LOS 체크박스 UI 상태 관리 및 데이터 연동
  const losCheck = document.getElementById('useLOS');
  const losLabel = document.getElementById('losStatusLabel');
  if (losCheck && losLabel) {
    const savedLOS = localStorage.getItem('arrow_sim_useLOS');
    losCheck.checked = savedLOS === 'true';
    losLabel.innerText = losCheck.checked ? 'ON' : 'OFF';

    losCheck.addEventListener('change', () => {
      losLabel.innerText = losCheck.checked ? 'ON' : 'OFF';
      localStorage.setItem('arrow_sim_useLOS', losCheck.checked);
      if (typeof drawScene === 'function') drawScene();
    });
  }

  // 과녁도 마우스 클릭 / 모바일 터치 드래그 연산 핸들러
  const simCanvas = document.getElementById('simCanvas');
  
  function handleTargetClickOrTouch(clientX, clientY) {
    if (!simCanvas) return; // 캔버스를 찾지 못했을 때 예외 처리 추가
    if (typeof currentView === 'undefined' || currentView !== 'target') return;
    
    const rect = simCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const clickX = (clientX - rect.left) * (simCanvas.width / rect.width) / dpr;
    const clickY = (clientY - rect.top) * (simCanvas.height / rect.height) / dpr;
    
    const targetViewScale = Math.min(dprWidth, dprHeight) / 5.5;
    const centerX = dprWidth / 2;
    const tBottomY = dprHeight * 0.65;
    
    const pZ = (clickX - centerX) / targetViewScale;
    const pY = (tBottomY - clickY) / targetViewScale;
    
    // 국궁 과녁 판정 범위 내 유효 필터링 (가로 ±1.5m, 세로 -0.5m ~ 3.5m)
    if (Math.abs(pZ) <= 1.5 && pY >= -0.5 && pY <= 3.5) {
      window.losLocalZ = pZ;
      const TGT_H = 2.667;
      const TGT_TILT = 15 * Math.PI / 180;
      const TGT_PROJ_H = TGT_H * Math.cos(TGT_TILT);
      window.losLocalY = pY - (TGT_PROJ_H / 2);
      
      if (losCheck) {
        losCheck.checked = true;
        losLabel.innerText = 'ON';
        localStorage.setItem('arrow_sim_useLOS', true);
      }
      if (typeof drawScene === 'function') drawScene();
    }
  }

  // PC 마우스 누르기 및 이동 바인딩
  simCanvas.addEventListener('mousedown', (e) => {
    handleTargetClickOrTouch(e.clientX, e.clientY);
  });

  // 모바일 터치 조준 및 드래그 트래킹 바인딩
  simCanvas.addEventListener('touchstart', (e) => {
    if (currentView === 'target') {
      e.preventDefault(); 
      handleTargetClickOrTouch(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  simCanvas.addEventListener('touchmove', (e) => {
    if (currentView === 'target') {
      e.preventDefault();
      handleTargetClickOrTouch(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

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
// ui.js의 DOMContentLoaded 리스너 내부 맨 아래에 추가
canvas.addEventListener('mousedown', handleCanvasClick);
canvas.addEventListener('touchstart', (e) => {
    if (currentView === 'target' && e.touches.length === 1) {
        // 드래그 기능과 충돌 방지를 위해 과녁도일 때만 터치 좌표 처리
        handleCanvasClick(e.touches[0]);
    }
});

function handleCanvasClick(e) {
    if (currentView !== 'target') return; // 과녁도 화면이 아닐 때는 무시

    // 캔버스 상의 실제 클릭 좌표 구하기
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width) / window.devicePixelRatio;
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height) / window.devicePixelRatio;

    // physics.js의 스케일 계산식 역산
    const targetViewScale = Math.min(dprWidth, dprHeight) / 5.5;
    const tBottomY = dprHeight * 0.65;

    // 클릭한 위치를 월드 좌표(Z, Y)로 변환
    const localZ = (clickX - (dprWidth / 2)) / targetViewScale;
    const localYFromBottom = (tBottomY - clickY) / targetViewScale;

    // 과녁 범위 안쪽 또는 주변을 클릭했을 때 점 저장 (원하는 경우 범위 제한 가능)
    selectedTargetPoint = { localZ: localZ, localYFromBottom: localYFromBottom };

    // 화면 다시 그리기
    if (typeof drawScene === 'function') drawScene();
}
