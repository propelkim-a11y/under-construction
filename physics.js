            // 과녁 충돌 및 마커 표시 연산
            const localYFromBottom = targetHitMetrics.localY + (TGT_PROJ_H / 2);
            const markerX = (dprWidth / 2) + (targetHitMetrics.localZ * targetViewScale);
            const markerY = tBottomY - (localYFromBottom * targetViewScale);

            if (targetHitMetrics.isHit) {
                ctx.fillStyle = '#34c759'; 
                ctx.strokeStyle = 'rgba(52, 199, 89, 0.4)'; 
                ctx.lineWidth = 8;
                ctx.beginPath(); 
                ctx.arc(markerX, markerY, 6, 0, Math.PI * 2); 
                ctx.stroke(); 
                ctx.fill();

                ctx.fillStyle = '#34c759'; 
                ctx.font = 'bold 13px -apple-system'; 
                ctx.textAlign = 'center';
                ctx.fillText("🎯 관중 (HIT!)", dprWidth / 2, tTopY - 14);
            } else {
                ctx.fillStyle = '#ff3b30'; 
                ctx.strokeStyle = 'rgba(255, 59, 48, 0.3)'; 
                ctx.lineWidth = 6;
                ctx.beginPath(); 
                ctx.arc(markerX, markerY, 5, 0, Math.PI * 2); 
                ctx.stroke(); 
                ctx.fill();

                ctx.fillStyle = '#ff3b30'; 
                ctx.font = 'bold 12px -apple-system'; 
                ctx.textAlign = 'center';
                ctx.fillText(`❌ 불중 (오차: 좌우 ${targetHitMetrics.localZ.toFixed(2)}m, 바닥높이 ${localYFromBottom.toFixed(2)}m)`, dprWidth / 2, tTopY - 14);
            }
        }

        // 과녁 조감도 표보기 조준점 시각화 (Target View 전용 주황색 링)
        const useLosCheckView = document.getElementById('useLos');
        if (useLosCheckView && useLosCheckView.checked) {
            const losY = parseFloat(document.getElementById('losTargetY').value) || 1.3;
            const losZ = parseFloat(document.getElementById('losTargetZ').value) || 0.0;
            const losScreenX = (dprWidth / 2) + (losZ * targetViewScale);
            const losScreenY = tBottomY - (losY * targetViewScale);

            ctx.save();
            ctx.strokeStyle = '#ff9500'; 
            ctx.lineWidth = 1.5;
            ctx.beginPath(); 
            ctx.arc(losScreenX, losScreenY, 6, 0, Math.PI * 2); 
            ctx.stroke();

            ctx.fillStyle = '#ff9500';
            ctx.beginPath(); 
            ctx.arc(losScreenX, losScreenY, 1.5, 0, Math.PI * 2); 
            ctx.fill();
            ctx.restore();
        }
    }

    // 3. 지면 지지 기둥 렌더링
    if (currentView === 'side' || currentView === 'front') {
        const tgtFloor = toScreen(targetBaseX, 0, 0);
        const tgtBasePos = toScreen(targetBaseX, safeTargetH, 0);
        ctx.strokeStyle = '#515154'; 
        ctx.lineWidth = 2;
        ctx.beginPath(); 
        ctx.moveTo(tgtBasePos.x, tgtBasePos.y); 
        ctx.lineTo(tgtBasePos.x, tgtFloor.y); 
        ctx.stroke();
    }

    // 4. (교정 완료) 3D 메인 뷰 조준선(LOS) 점선 드로잉 시스템
    const useLosCheckMain = document.getElementById('useLos');
    if (useLosCheckMain && useLosCheckMain.checked && currentView !== 'target') {
        ctx.save();
        const startX = 0;
        const startY = parseFloat(document.getElementById('launchHeight').value) || 1.5;
        const startZ = parseFloat(document.getElementById('launchZ').value) || 0;
        const losY = parseFloat(document.getElementById('losTargetY').value) || 1.3;
        const losZ = parseFloat(document.getElementById('losTargetZ').value) || 0.0;

        // 과녁의 월드 공간 높이 동기화 연산
        const centerWorldY = safeTargetH + (TGT_H / 2) * Math.cos(TGT_TILT);
        const absoluteLosX = targetBaseX;
        const absoluteLosY = centerWorldY + losY;
        const absoluteLosZ = startZ + losZ;

        const screenStart = toScreen(startX, startY, startZ);
        const screenEnd = toScreen(absoluteLosX, absoluteLosY, absoluteLosZ);

        ctx.strokeStyle = '#ff9500'; 
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]); // 4px 실선, 4px 공백의 점선 스타일 지정
        ctx.beginPath(); 
        ctx.moveTo(screenStart.x, screenStart.y); 
        ctx.lineTo(screenEnd.x, screenEnd.y); 
        ctx.stroke();
        ctx.setLineDash([]); // 대시 스타일 리셋

        ctx.fillStyle = '#ff9500';
        ctx.beginPath(); 
        ctx.arc(screenEnd.x, screenEnd.y, 3, 0, Math.PI * 2); 
        ctx.fill();
        ctx.restore();
    }

    // 5. 실시간 화살 궤적선 드로잉
    if (currentView !== 'target' && trajectory.length > 1) {
        ctx.strokeStyle = '#0071e3'; 
        ctx.lineWidth = 2.5; 
        ctx.beginPath();
        const start = toScreen(trajectory[0].x, trajectory[0].y, trajectory[0].z);
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < trajectory.length; i++) {
            const pt = toScreen(trajectory[i].x, trajectory[i].y, trajectory[i].z);
            ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
    }

    // 6. 실시간 화살 오브젝트 렌더링
    if (currentView !== 'target') {
        const arrowPos = toScreen(arrowState.x, arrowState.y, arrowState.z);
        ctx.save(); 
        ctx.translate(arrowPos.x, arrowPos.y);
        
        let angleRad = 0;
        if (currentView === 'side') angleRad = -arrowState.pitch;
        else if (currentView === 'top') angleRad = -arrowState.yaw;
        else if (currentView === 'front') angleRad = Math.atan2(arrowState.vz, arrowState.vy);

        ctx.rotate(angleRad);
        ctx.strokeStyle = '#515154'; 
        ctx.lineWidth = 2; 
        ctx.beginPath(); 
        ctx.moveTo(-20, 0); 
        ctx.lineTo(0, 0); 
        ctx.stroke();

        ctx.fillStyle = '#1d1d1f'; 
        ctx.beginPath(); 
        ctx.moveTo(0, 0); 
        ctx.lineTo(-6, -3); 
        ctx.lineTo(-6, 3); 
        ctx.closePath(); 
        ctx.fill();

        ctx.fillStyle = '#ff9500'; 
        ctx.beginPath(); 
        ctx.moveTo(-20, 0); 
        ctx.lineTo(-16, -4); 
        ctx.lineTo(-10, -4); 
        ctx.lineTo(-14, 0); 
        ctx.fill();
        ctx.restore();
    }
}
