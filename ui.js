  // 이전 사용 위치 복원 함수
  function loadButtonPosition() {
    const savedLeft = localStorage.getItem('arrow_sim_btn_left');
    const savedTop = localStorage.getItem('arrow_sim_btn_top');
    
    if (savedLeft !== null && savedTop !== null) {
      dragBtn.style.left = savedLeft;
      dragBtn.style.top = savedTop;
      dragBtn.style.right = 'auto'; // 초기 CSS 우측 고정 해제
      dragBtn.style.bottom = 'auto'; // 초기 CSS 하단 고정 해제
    }
  }

  function startDrag(e) {
    isDragging = true;
    hasMoved = false;
    
    // 터치 이벤트와 마우스 이벤트 대응
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    startX = clientX;
    startY = clientY;
    
    const rect = dragBtn.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    // 드래그 중 스타일 적용 (선택 사항)
    dragBtn.style.transition = 'none'; 

    // 전역 이벤트 리스너 등록 (마우스가 버튼을 벗어나도 부드럽게 추적)
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
  }

  function onDrag(e) {
    if (!isDragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // 이동 거리 계산
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    
    // 미세한 움직임이 발생하면 이동한 것으로 간주 (클릭과 드래그 구분용)
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      hasMoved = true;
    }
    
    // 새 위치 계산
    let newLeft = initialLeft + deltaX;
    let newTop = initialTop + deltaY;
    
    // [보정] 버튼이 브라우저 화면 밖으로 탈출하는 것을 방지
    const maxLeft = window.innerWidth - dragBtn.offsetWidth;
    const maxTop = window.innerHeight - dragBtn.offsetHeight;
    
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));
    
    // 스타일 반영
    dragBtn.style.left = `${newLeft}px`;
    dragBtn.style.top = `${newTop}px`;
    dragBtn.style.right = 'auto';
    dragBtn.style.bottom = 'auto';
    
    // 모바일 스크롤 방지
    if (e.cancelable) e.preventDefault();
  }

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    
    // 스타일 복구
    dragBtn.style.transition = ''; 

    // 전역 이벤트 리스너 제거
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchend', endDrag);
    
    // 이동이 이루어졌다면 현재 위치를 로컬 스토리지에 기억
    if (hasMoved) {
      localStorage.setItem('arrow_sim_btn_left', dragBtn.style.left);
      localStorage.setItem('arrow_sim_btn_top', dragBtn.style.top);
    }
  }

  // 초기 실행: 위치 복원 및 이벤트 바인딩
  loadButtonPosition();
  
  dragBtn.addEventListener('mousedown', startDrag);
  dragBtn.addEventListener('touchstart', startDrag, { passive: true });

  // 클릭 이벤트 처리 (드래그하지 않고 단순히 클릭만 했을 때 발사 기능 연동)
  dragBtn.addEventListener('click', (e) => {
    if (hasMoved) {
      // 드래그 한 것이라면 클릭 동작(예: 발사)을 취소함
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // 드래그 없이 클릭만 했다면 기존 시뮬레이터 발사 함수 실행
    if (typeof fireArrow === 'function') {
      fireArrow();
    }
  });
});
  // doDrag 함수 수정 (e.touches[0] 에러 예방 조건문 추가)
  function doDrag(e) {
    if (!isDragging) return;
    const clientX = e.touches ? (e.touches[0] ? e.touches[0].clientX : startX) : e.clientX;
    const clientY = e.touches ? (e.touches[0] ? e.touches[0].clientY : startY) : e.clientY;
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
 
  const useLosCheck = document.getElementById('useLos');
  if (useLosCheck) {
    const savedLos = localStorage.getItem('arrow_sim_useLos');
    useLosCheck.checked = (savedLos === 'true');

    useLosCheck.addEventListener('change', () => {
      localStorage.setItem('arrow_sim_useLos', useLosCheck.checked);
      if (typeof drawScene === 'function') drawScene();
    });
  }  
  
}); // 💡 닫는 괄호 위치 조정으로 DOMContentLoaded 스크립트 구문 오류 수정 완료

// 인트로 공지사항 모달 닫기 함수
function closeIntro() {
  const introModal = document.getElementById('introModal');
  if (introModal) {
    introModal.style.opacity = '0';
    introModal.style.visibility = 'hidden';
    setTimeout(() => {
      introModal.style.display = 'none';
    }, 300);
  }
}

// =========================================================
// 🎯 과녁도 표보기 조준점 실시간 터치/마우스 드래그 제어 시스템
// =========================================================
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

function endTargetDrag(e) {
    if (isTargetDragging) {
        isTargetDragging = false;
    }
}

// =========================================================
// 💡 [추가 완료] 과녁 평면 캔버스 좌표 -> 시뮬레이터 수학 좌표 변환 및 UI 연동 로직
// =========================================================
function updateTargetCoords(e) {
  if (!simCanvasEl) return;

  // 1. 브라우저 화면 상의 캔버스 실제 사각형 위치 구하기
  const rect = simCanvasEl.getBoundingClientRect();
  
  // 2. 이벤트 종류에 따른 정확한 클라이언트 좌표 추출
  const clientX = e.touches ? (e.touches[0] ? e.touches[0].clientX : 0) : e.clientX;
  const clientY = e.touches ? (e.touches[0] ? e.touches[0].clientY : 0) : e.clientY;

  // 3. CSS 크기 대비 마우스의 내부 상대적 픽셀 위치 구하기 (0 ~ Canvas 크기)
  const canvasX = (clientX - rect.left) * (simCanvasEl.width / rect.width);
  const canvasY = (clientY - rect.top) * (simCanvasEl.height / rect.height);

  // 💡 [수식 보정 핵심] 캔버스 중앙(과녁 중심)을 (0,0) 좌표계로 전환
  // Canvas는 좌상단이 (0,0)이지만 과녁 시뮬레이터 수식은 정중앙이 중심입니다.
  const centerX = simCanvasEl.width / 2;
  const centerY = simCanvasEl.height / 2;

  // 4. 과녁 반지름 스케일 비율 계산 (물리 모델 스케일 연동용 변수)
  // 일반적으로 과녁 시뮬레이터는 반지름을 1~2m 내외로 잡으므로, 캔버스 크기 대비 스케일을 곱해줍니다.
  const scale = (typeof TARGET_SCALE !== 'undefined') ? TARGET_SCALE : 0.005; 

  // 5. 물리적 수평(Y)/수직(Z) 편차값 도출 
  // Canvas Y축은 아래로 갈수록 커지므로 물리 좌표 Z(높이)는 반대로 빼주어야 정상 작동합니다.
  const computedY = (canvasX - centerX) * scale;
  const computedZ = (centerY - canvasY) * scale;

  // 6. UI 입력창 데이터 갱신 및 로컬스토리지 저장
  const elY = document.getElementById('losTargetY');
  const elZ = document.getElementById('losTargetZ');

  if (elY) {
    elY.value = computedY.toFixed(3);
    localStorage.setItem('arrow_sim_losTargetY', elY.value);
  }
  if (elZ) {
    elZ.value = computedZ.toFixed(3);
    localStorage.setItem('arrow_sim_losTargetZ', elZ.value);
  }

  // 7. 데이터가 바뀌었으므로 실시간으로 화면을 재점사
  if (typeof drawScene === 'function') drawScene();
}
// 변수 충돌 없는 좌표 역산 처리 핵심 함수
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
    
    const tBottomY = currentDprHeight * 0.65;
    const targetViewScale = Math.min(currentDprWidth, currentDprHeight) / 5.5;
    
    const calculatedZ = (canvasX - (currentDprWidth / 2)) / targetViewScale;
    const calculatedY = (tBottomY - canvasY) / targetViewScale;
    
    const losYEl = document.getElementById('losTargetY');
    const losZEl = document.getElementById('losTargetZ');
    const useLosEl = document.getElementById('useLos');
    
    if (losYEl && losZEl) {
        losYEl.value = calculatedY.toFixed(2);
        losZEl.value = calculatedZ.toFixed(2);
        
        if (useLosEl && !useLosEl.checked) {
            useLosEl.checked = true;
            localStorage.setItem('arrow_sim_useLos', 'true');
        }
        
        const intTrigger = new Event('input', { bubbles: true });
        losYEl.dispatchEvent(intTrigger);
        losZEl.dispatchEvent(intTrigger);

        if (typeof saveSettings === 'function') saveSettings();
        if (typeof drawScene === 'function') drawScene();
    }
}

// =========================================================================
// 📱 [개선 완료] 설정 패널 하단 좌우 터치 슬라이드(스와이프) 제어 시스템 (간섭 차단 패치)
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
  const panelContainer = document.getElementById('panel-container');
  if (!panelContainer) return;

  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  const tabOrder = ['arrow', 'method', 'env', 'result'];

  function getCurrentActiveTab() {
    for (let i = 0; i < tabOrder.length; i++) {
      const el = document.getElementById('panel-' + tabOrder[i]);
      if (el && el.classList.contains('active')) {
        return tabOrder[i];
      }
    }
    return 'arrow';
  }

  // 터치 시작 이벤트 탐지
  panelContainer.addEventListener('touchstart', (e) => {
    // 💡 [UX 패치 1] 유저가 입력 필드(input, select, textarea)나 range 슬라이더를 만질 때는 스와이프를 무시합니다.
    const targetTagName = e.target.tagName.toLowerCase();
    const isRangeInput = e.target.type === 'range';
    if (targetTagName === 'input' || targetTagName === 'select' || targetTagName === 'textarea' || isRangeInput) {
      touchStartX = 0; // 좌표를 0으로 만들어 무효화
      touchStartY = 0;
      return;
    }

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  // 터치 종료 및 슬라이드 방향 계산 판정
  panelContainer.addEventListener('touchend', (e) => {
    if (touchStartX === 0 && touchStartY === 0) return; // 무효화된 터치인 경우 즉시 종료

    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // 수평 이동 거리가 수직 이동 거리보다 크고, 최소 60px 이상 움직였을 때만 슬라이드로 인정
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 60) {
      const currentTab = getCurrentActiveTab();
      let currentIndex = tabOrder.indexOf(currentTab);

      if (deltaX < 0) {
        // ⬅️ 왼쪽으로 스와이프: 다음 탭으로 이동
        if (currentIndex < tabOrder.length - 1) {
          switchPanel(tabOrder[currentIndex + 1]);
          triggerHapticFeedback(); // 💡 시각/인지 효과 지원
        }
      } else {
        // ➡️ 오른쪽으로 스와이프: 이전 탭으로 이동
        if (currentIndex > 0) {
          switchPanel(tabOrder[currentIndex - 1]);
          triggerHapticFeedback(); // 💡 시각/인지 효과 지원
        }
      }
    }
    
    // 좌표 초기화
    touchStartX = 0;
    touchStartY = 0;
  }, { passive: true });

  // 💡 [UX 패치 2] 탭이 바뀔 때 모바일 유저가 인지하기 쉽도록 스크롤을 상단으로 초기화하거나 가벼운 진동(지원 기기만)을 주는 헬퍼 함수
  function triggerHapticFeedback() {
    // 설정 패널 내부 스크롤이 내려가 있었다면 맨 위로 부드럽게 올려줌
    panelContainer.scrollTo({ top: 0, behavior: 'smooth' });
    
    // 모바일 하드웨어 진동 지원 시 미세한 햅틱 피드백 (10ms)
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }
});

