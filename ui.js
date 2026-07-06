const INPUT_IDS = [
  'weight', 'diameter', 'dragCoeff', 'liftCoeff',
  'angle', 'velocity', 'yawAngle', 'launchHeight', 'launchZ',
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
  // 1. LOS 체크박스 상태 복원 및 이벤트 등록 (기존 추가본)
  const useLosCheck = document.getElementById('useLos');
  if (useLosCheck) {
    const savedLos = localStorage.getItem('arrow_sim_useLos');
    useLosCheck.checked = (savedLos === 'true');

    useLosCheck.addEventListener('change', () => {
      localStorage.setItem('arrow_sim_useLos', useLosCheck.checked);
      if (typeof drawScene === 'function') drawScene();
    });
  }


  // 2. [신설] 과녁도 터치/마우스 조준 제어 시스템 (방금 안내해 드린 코드)
  // =========================================================
  // ⚡ [안전 보강 완료] 과녁도 터치/마우스 조준 제어 시스템
  // =========================================================
   // =========================================================
  // ⚡ [안전 보강 완료] 과녁도 터치/마우스 조준 제어 시스템
  // =========================================================
  let isTargetSighting = false;

  function handleTargetSight(e) {
    // [보안] 사법 설정의 체크박스가 꺼져있다면 아무것도 하지 않음
    if (useLosCheck && !useLosCheck.checked) return;

    // 1. 캔버스 엘리먼트 안전하게 가져오기
    const canvasEl = document.getElementById('simCanvas');
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();

    // 2. 터치 및 마우스 좌표 추출
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // 3. 캔버스 내부 기준의 픽셀 좌표 구하기
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    // 4. dpr 변수 안전 장치 (만약 전역 변수가 없으면 캔버스 실제 크기 사용)
    const currentW = (typeof dprWidth !== 'undefined') ? dprWidth : canvasEl.width;
    const currentH = (typeof dprHeight !== 'undefined') ? dprHeight : canvasEl.height;

    // 5. 화면 픽셀 -> 월드 미터(m) 역산 공식
    const targetViewScale = Math.min(currentW, currentH) / 5.5;
    const worldZ = (screenX - (rect.width / 2)) / (rect.width / currentW) / targetViewScale;
    const worldY = ((currentH * 0.65) - (screenY * (currentH / rect.height))) / targetViewScale;

    // 6. UI 입력창 수치 실시간 주입
    const inputY = document.getElementById('losTargetY');
    const inputZ = document.getElementById('losTargetZ');
    
    if (inputY) inputY.value = worldY.toFixed(2);
    if (inputZ) inputZ.value = worldZ.toFixed(2);

    // 7. 실시간 화면 갱신 함수 실행
    if (typeof drawScene === 'function') drawScene();
  }

  const simCanvasEl = document.getElementById('simCanvas');
  if (simCanvasEl) {
    // 마우스 다운 -> 조준 시작
    simCanvasEl.addEventListener('mousedown', (e) => {
      isTargetSighting = true;
      handleTargetSight(e);
    });

    // 마우스 이동 -> 드래그 트래킹
    window.addEventListener('mousemove', (e) => {
      if (isTargetSighting) handleTargetSight(e);
    });

    // 마우스 업 -> 종료
    window.addEventListener('mouseup', () => {
      isTargetSighting = false;
    });

    // 모바일 터치 스타트
    simCanvasEl.addEventListener('touchstart', (e) => {
      isTargetSighting = true;
      handleTargetSight(e);
    }, { passive: true });

    // 모바일 터치 무브
    window.addEventListener('touchmove', (e) => {
      if (isTargetSighting) {
        if (e.cancelable) e.preventDefault(); 
        handleTargetSight(e);
      }
    }, { passive: false });

    // 모바일 터치 엔드
    window.addEventListener('touchend', () => {
      isTargetSighting = false;
    });
  }

 
 

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
