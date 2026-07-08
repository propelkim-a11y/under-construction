const INPUT_IDS = [
 'weight', 'diameter', 'dragCoeff', 'liftCoeff',
 'angle', 'velocity', 'yawAngle', 'launchHeight', 'launchZ',
 'windX', 'windY', 'targetHeight', 'airDensity',
 'losTargetY', 'losTargetZ'
];

function saveSettings() {
 try {
   INPUT_IDS.forEach(id => {
     const el = document.getElementById(id);
     if (el) localStorage.setItem('arrow_sim_' + id, el.value);
   });
   const useLosEl = document.getElementById('useLos');
   if (useLosEl) localStorage.setItem('arrow_sim_useLos', useLosEl.checked ? 'true' : 'false');
 } catch (e) {
   console.warn("saveSettings 차단됨:", e);
 }
}

function loadSettings() {
 try {
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
 } catch (e) {
   console.warn("loadSettings 차단됨:", e);
 }
}

function switchPanel(type) {
 switchPanel_orig(type);
}

function switchPanel_orig(type) {
 if (typeof saveSettings === 'function') saveSettings();
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
       if (typeof saveSettings === 'function') saveSettings();
       if (typeof drawScene === 'function') drawScene();
     });
   }
 });

 const dragBtn = document.getElementById('draggableFireBtn');
 if (dragBtn) {
   let isDragging = false;
   let hasMoved = false;
   let startX = 0, startY = 0;
   let initialLeft = 0, initialTop = 0;

   function loadButtonPosition() {
     try {
       const savedLeft = localStorage.getItem('arrow_sim_btn_left');
       const savedTop = localStorage.getItem('arrow_sim_btn_top');
       if (savedLeft !== null && savedTop !== null) {
         dragBtn.style.left = savedLeft;
         dragBtn.style.top = savedTop;
         dragBtn.style.right = 'auto';
       }
     } catch(e) {
       console.warn("loadButtonPosition 차단됨:", e);
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
       try {
         localStorage.setItem('arrow_sim_btn_left', dragBtn.style.left);
         localStorage.setItem('arrow_sim_btn_top', dragBtn.style.top);
       } catch(e) {
         console.warn("버튼 위치 저장 차단됨:", e);
       }
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

 const useLosCheck = document.getElementById('useLos');
 if (useLosCheck) {
   try {
     const savedLos = localStorage.getItem('arrow_sim_useLos');
     useLosCheck.checked = (savedLos === 'true');
   } catch(e) {
     console.warn("useLos 복원 차단됨:", e);
   }
   useLosCheck.addEventListener('change', () => {
     try {
       localStorage.setItem('arrow_sim_useLos', useLosCheck.checked);
     } catch(e) {
       console.warn("useLos 저장 차단됨:", e);
     }
     if (typeof drawScene === 'function') drawScene();
   });
 } 
});

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
