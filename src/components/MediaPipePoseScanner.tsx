import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

interface MediaPipeScannerProps {
  facing: 'front' | 'back';
  targetReps: number;
  drillType: string;
  isHandheld?: boolean;
  onRepCountChange?: (reps: number, statusText: string) => void;
  onComplete: (metrics: {
    reps: number;
    score: number;
    asymmetryIndex: number;
    detectedErrors: string[];
  }) => void;
  onCancel?: () => void;
}

export default function MediaPipePoseScanner({
  facing,
  targetReps,
  drillType,
  isHandheld = true,
  onRepCountChange,
  onComplete,
}: MediaPipeScannerProps) {
  const webviewRef = useRef<WebView>(null);
  const [currentFacing, setCurrentFacing] = useState<'front' | 'back'>(facing);
  const cameraMode = currentFacing === 'front' ? 'user' : 'environment';
  const [webSimReps, setWebSimReps] = useState(0);
  

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #020617; overflow: hidden; font-family: sans-serif; }
    #container { position: relative; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
    video { position: absolute; width: 100%; height: 100%; object-fit: contain; ${currentFacing === 'front' ? 'transform: scaleX(-1);' : ''} }
    canvas { position: absolute; width: 100%; height: 100%; object-fit: contain; ${currentFacing === 'front' ? 'transform: scaleX(-1);' : ''} z-index: 5; }
    #hud {
      position: absolute; top: 10px; left: 10px; right: 10px; z-index: 10;
      display: flex; flex-direction: column; align-items: center; pointer-events: none;
    }
    #bottom_controls {
      position: absolute; bottom: 14px; left: 14px; right: 14px; z-index: 15;
      display: flex; justify-content: space-between; align-items: center; gap: 8px;
    }
    .fov-btn {
      background: rgba(15, 23, 42, 0.92); color: #38bdf8; border: 1.5px solid #0284c7;
      padding: 8px 13px; border-radius: 18px; font-weight: bold; font-size: 11px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5); cursor: pointer;
    }
    .badge {
      background: rgba(15, 23, 42, 0.92); color: #fff; padding: 7px 15px;
      border-radius: 20px; font-weight: bold; font-size: 12px; border: 1.5px solid #334155;
      margin-bottom: 5px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4);
    }
    .light-pill {
      background: rgba(15, 23, 42, 0.9); color: #fbbf24; padding: 4px 11px;
      border-radius: 14px; font-weight: 700; font-size: 10px; border: 1px solid #f59e0b;
      margin-bottom: 5px; text-align: center;
    }
    .light-ok { color: #4ade80; border-color: #22c55e; }
    .light-bad { color: #f87171; border-color: #ef4444; }
    .metrics-row { display: flex; gap: 6px; margin-top: 2px; flex-wrap: wrap; justify-content: center; }
    .metric-pill {
      background: rgba(15, 23, 42, 0.88); color: #38bdf8; padding: 5px 11px;
      border-radius: 12px; font-weight: 800; font-size: 11px; border: 1px solid #0284c7;
    }
    .status-warn { color: #f87171; border-color: #ef4444; }
    .status-ok { color: #4ade80; border-color: #22c55e; }
    .status-ready { color: #38bdf8; border-color: #0ea5e9; }
    .status-down { color: #fbbf24; border-color: #f59e0b; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" crossorigin="anonymous"></script>
</head>
<body>
  <div id="container">
    <video id="input_video" playsinline muted autoplay></video>
    <canvas id="output_canvas"></canvas>
    <div id="hud">
      <div id="light_badge" class="light-pill light-ok">💡 Oświetlenie: Kalibracja czujnika...</div>
      <div id="status_badge" class="badge status-warn">Cofnij się tak, aby było widać sylwetkę...</div>
      <div class="metrics-row">
        <div id="reps_badge" class="badge" style="margin-bottom:0;">
          ${drillType === 'plank' ? 'CZAS' : 'POWTÓRZENIA'}: 0 / ${targetReps}
        </div>
        <div id="angle_badge" class="metric-pill">KĄT: --°</div>
        <div id="model_badge" class="metric-pill" style="color:#a855f7; border-color:#9333ea;">AI: FULL (Smooth)</div>
      </div>
    </div>
    <div id="bottom_controls">
      <button id="model_btn" class="fov-btn" onclick="toggleModelComplexity()">🧠 Model: FULL (Dokładny)</button>
      <button id="switch_cam_btn" class="fov-btn" onclick="sendToRN({type: 'SWITCH_CAMERA'})" style="border-color:#10b981; color:#34d399;">🔄 Obróć Aparat</button>
      ${currentFacing === 'back' ? `<button id="lens_btn" class="fov-btn" onclick="switchWideLens()" style="display:none;">🔍 Obiektyw</button>` : '<div></div>'}
    </div>
  </div>

  <script>
    const videoElement = document.getElementById('input_video');
    const canvasElement = document.getElementById('output_canvas');
    const canvasCtx = canvasElement.getContext('2d');
    const statusBadge = document.getElementById('status_badge');
    const lightBadge = document.getElementById('light_badge');
    const repsBadge = document.getElementById('reps_badge');
    const angleBadge = document.getElementById('angle_badge');
    const modelBadge = document.getElementById('model_badge');
    const modelBtn = document.getElementById('model_btn');
    const lensBtn = document.getElementById('lens_btn');

    // Ukryty mikro-canvas do analizy jasności oświetlenia i ekspozycji pod światło
    const lightCanvas = document.createElement('canvas');
    lightCanvas.width = 32;
    lightCanvas.height = 32;
    const lightCtx = lightCanvas.getContext('2d', { willReadFrequently: true });
    let frameCounter = 0;

    let reps = 0;
    const targetReps = ${targetReps};
    const currentDrill = '${drillType}';
    const isHandheld = ${isHandheld ? 'true' : 'false'};

    // Parametry modelu AI zgodnie z planem optymalizacji:
    // Model Full (1), obniżone progi pewności (0.50), włączone wygładzanie czasowe smoothLandmarks
    let currentComplexity = 1;

    let phase = 'ALIGN';
    let repStage = 'UP';
    let downFramesCount = 0;
    let upFramesCount = 0;
    let lastRepTimestamp = 0;

    let countdownLeft = 5;
    let countdownInterval = null;
    let lastPlankTick = 0;

    let smoothPrimaryAngle = 175;
    let standingHipKneeDist = null;
    let baselineHipX = null;

    let asymmetrySamples = [];
    let minAnglesPerRep = [];
    let currentRepMinAngle = 180;
    let detectedErrorsSet = new Set();
    let isFinished = false;

    let backCameras = [];
    let currentCamIndex = 0;
    let currentStream = null;

    function speakTTS(text) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = 'pl-PL';
        msg.rate = 1.05;
        window.speechSynthesis.speak(msg);
      }
    }


    function sendToRN(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      } else if (window.parent) {
        window.parent.postMessage(JSON.stringify(payload), '*');
      }
    }

    function analyzeLighting() {
      try {
        lightCtx.drawImage(videoElement, 0, 0, 32, 32);
        const imgData = lightCtx.getImageData(0, 0, 32, 32).data;
        let sumLuma = 0;
        let brightPixels = 0;
        const totalPixels = 32 * 32;

        for (let i = 0; i < imgData.length; i += 4) {
          const luma = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
          sumLuma += luma;
          if (luma > 240) brightPixels++;
        }

        const avgLuma = Math.round(sumLuma / totalPixels);

        if (avgLuma < 52) {
          lightBadge.className = 'light-pill light-bad';
          lightBadge.innerText = '💡 ZA CIEMNO (' + avgLuma + '): Zapal światło lub stań przodem do lampy!';
        } else if (brightPixels > totalPixels * 0.35) {
          lightBadge.className = 'light-pill light-bad';
          lightBadge.innerText = '☀️ POD ŚWIATŁO: Nie stój na tle jasnego okna!';
        } else {
          lightBadge.className = 'light-pill light-ok';
          lightBadge.innerText = '💡 Oświetlenie optymalne (' + avgLuma + ') • Szkielet stabilny';
        }
      } catch (e) {}
    }

    function calculateAngle(a, b, c) {
      const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
      let angle = Math.abs(radians * 180.0 / Math.PI);
      if (angle > 180.0) angle = 360.0 - angle;
      return angle;
    }

    function drawGhostGuide(ctx, width, height) {
      ctx.save();
      ctx.strokeStyle = phase === 'ALIGN' ? 'rgba(56, 189, 248, 0.5)' : 'rgba(34, 197, 94, 0.35)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);

      const centerX = width / 2;
      if (currentDrill === 'plank' || currentDrill === 'pushups') {
        ctx.strokeRect(width * 0.08, height * 0.36, width * 0.84, height * 0.38);
      } else {
        ctx.beginPath();
        ctx.arc(centerX, height * 0.16, 30, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.strokeRect(centerX - 65, height * 0.24, 130, height * 0.66);
      }
      ctx.restore();
    }

    function finishExercise() {
      if (isFinished) return;
      isFinished = true;
      statusBadge.className = 'badge status-ok';
      statusBadge.innerText = '🏆 Zadanie zaliczone! Twój Awatar zyskuje XP!';

      const avgAsym = asymmetrySamples.length > 0
        ? Math.min(18, Math.max(1, Math.round(asymmetrySamples.reduce((a, b) => a + b, 0) / asymmetrySamples.length * 1.8)))
        : 3;

      let depthPenalty = 0;
      if (minAnglesPerRep.length > 0) {
        const avgDepthAngle = minAnglesPerRep.reduce((a, b) => a + b, 0) / minAnglesPerRep.length;
        if (avgDepthAngle > 125) {
          depthPenalty = 6;
          detectedErrorsSet.add('shallow_range');
        }
      }

      const finalScore = Math.max(70, Math.min(99, 96 - avgAsym - depthPenalty - (detectedErrorsSet.size * 3)));

      setTimeout(() => {
        sendToRN({
          type: 'COMPLETE',
          metrics: {
            reps: reps,
            score: Math.round(finalScore),
            asymmetryIndex: avgAsym,
            detectedErrors: Array.from(detectedErrorsSet)
          }
        });
      }, 600);
    }

    function resetCountdownIfNeeded(reasonText) {
      if (phase === 'COUNTDOWN') {
        clearInterval(countdownInterval);
        countdownInterval = null;
        phase = 'ALIGN';
      }
      statusBadge.className = 'badge status-warn';
      statusBadge.innerText = reasonText;
      angleBadge.innerText = 'KĄT: --°';
      sendToRN({ type: 'STATUS', reps, statusText: reasonText });
    }

    function onResults(results) {
      if (isFinished) return;

      frameCounter++;
      if (frameCounter % 20 === 0) {
        analyzeLighting();
      }

      canvasElement.width = videoElement.videoWidth || 480;
      canvasElement.height = videoElement.videoHeight || 640;
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      drawGhostGuide(canvasCtx, canvasElement.width, canvasElement.height);

      if (!results.poseLandmarks || results.poseLandmarks.length < 29) {
        resetCountdownIfNeeded('⚠️ WEJDŹ W KADR: Popraw kąt lub oświetlenie.');
        canvasCtx.restore();
        return;
      }

      const lm = results.poseLandmarks;
      const lShoulder = lm[11], rShoulder = lm[12];
      const lElbow = lm[13], rElbow = lm[14];
      const lWrist = lm[15], rWrist = lm[16];
      const lHip = lm[23], rHip = lm[24];
      const lKnee = lm[25], rKnee = lm[26];
      const lAnkle = lm[27], rAnkle = lm[28];

      // Rysowanie cyfrowego szkieletu zawodnika
      drawConnectors(canvasCtx, lm, POSE_CONNECTIONS, { color: '#00FF66', lineWidth: 3 });
      drawLandmarks(canvasCtx, lm, { color: '#FF3366', lineWidth: 1, radius: 4 });

      // Obniżone progi widoczności (0.38 - 0.42), aby nie gubić klatek przy dynamicznych wyskokach i słabszym świetle
      const shouldersVisible = lShoulder.visibility > 0.42 && rShoulder.visibility > 0.42;
      const hipsVisible = lHip.visibility > 0.40 && rHip.visibility > 0.40 && lHip.y < 0.96 && rHip.y < 0.96;
      const kneesVisible = lKnee.visibility > 0.38 && rKnee.visibility > 0.38 && lKnee.y < 0.99 && rKnee.y < 0.99;
      const anklesVisible = lAnkle.visibility > 0.35 && rAnkle.visibility > 0.35;

      if (currentDrill !== 'plank' && currentDrill !== 'pushups' && (!hipsVisible || !kneesVisible)) {
        resetCountdownIfNeeded('⚠️ COFNIJ SIĘ O KROK: Kamera musi widzieć Twoje BIODRA i KOLANA!');
        if (frameCounter % 60 === 0) speakTTS('Cofnij się o krok');
        canvasCtx.restore();
        return;
      }

      // Obliczanie głównego kąta w zależności od rodzaju ćwiczenia
      let rawAngle = 175;
      if (currentDrill === 'pushups') {
        const leftElbowAngle = calculateAngle(lShoulder, lElbow, lWrist);
        const rightElbowAngle = calculateAngle(rShoulder, rElbow, rWrist);
        rawAngle = (leftElbowAngle + rightElbowAngle) / 2;
      } else if (anklesVisible) {
        const leftAngle = calculateAngle(lHip, lKnee, lAnkle);
        const rightAngle = calculateAngle(rHip, rKnee, rAnkle);
        rawAngle = (leftAngle + rightAngle) / 2;
      } else {
        const virtualLeftAnkle = { x: lKnee.x, y: Math.min(0.99, lKnee.y + 0.22) };
        const virtualRightAnkle = { x: rKnee.x, y: Math.min(0.99, rKnee.y + 0.22) };
        const leftAngle = calculateAngle(lHip, lKnee, virtualLeftAnkle);
        const rightAngle = calculateAngle(rHip, rKnee, virtualRightAnkle);
        rawAngle = (leftAngle + rightAngle) / 2;
      }

      // Wygładzanie czasowe kąta (dodatkowy filtr dolnoprzepustowy dla trybu "Rodzic trzyma w dłoni")
      const smoothingFactor = isHandheld ? 0.75 : 0.68;
      smoothPrimaryAngle = smoothPrimaryAngle * smoothingFactor + rawAngle * (1 - smoothingFactor);
      const roundedAngle = Math.round(smoothPrimaryAngle);

      angleBadge.innerText =
        currentDrill === 'plank'
          ? 'STABILIZACJA: CORE'
          : currentDrill === 'pushups'
          ? 'KĄT ŁOKCI: ' + roundedAngle + '°'
          : 'KĄT KOLAN: ' + roundedAngle + '°';

      const avgHipY = (lHip.y + rHip.y) / 2;
      const avgKneeY = (lKnee.y + rKnee.y) / 2;
      const avgHipX = (lHip.x + rHip.x) / 2;
      const currentHipKneeVertDist = Math.max(0.01, avgKneeY - avgHipY);

      if (phase === 'ALIGN') {
        phase = 'COUNTDOWN';
        countdownLeft = 5;
        standingHipKneeDist = currentHipKneeVertDist;
        baselineHipX = avgHipX;
        statusBadge.className = 'badge status-ready';
        statusBadge.innerText = '⏱️ Przygotuj pozycję! Start za ' + countdownLeft + 's';

        countdownInterval = setInterval(() => {
          countdownLeft -= 1;
          if (countdownLeft > 0) {
            statusBadge.className = 'badge status-ready';
            statusBadge.innerText = '⏱️ Przygotuj pozycję! Start za ' + countdownLeft + 's';
            if (countdownLeft <= 3 && countdownLeft > 0) speakTTS(countdownLeft.toString());
          } else {
            clearInterval(countdownInterval);
            countdownInterval = null;
            phase = 'ACTIVE_TEST';
            repStage = 'UP';
            lastPlankTick = Date.now();
            statusBadge.className = 'badge status-ok';
            statusBadge.innerText = currentDrill === 'plank'
              ? '🔥 START! Utrzymaj poziomą deskę.'
              : currentDrill === 'pushups'
              ? '🔥 START! Ugnij łokcie poniżej 115° i wróć w górę.'
              : '🔥 START! Wykonuj powtórzenia w ramce AI.';
            speakTTS('Start');
          }
        }, 1000);

        canvasCtx.restore();
        return;
      }

      if (phase === 'COUNTDOWN') {
        standingHipKneeDist = standingHipKneeDist * 0.85 + currentHipKneeVertDist * 0.15;
        baselineHipX = baselineHipX * 0.85 + avgHipX * 0.15;
        canvasCtx.restore();
        return;
      }

      const hipAsym = Math.abs(lHip.y - rHip.y) * 100;
      const kneeAsym = Math.abs(lKnee.y - rKnee.y) * 100;
      asymmetrySamples.push((hipAsym + kneeAsym) / 2);

      // 1. LOGIKA DLA DESKI (PLANK - STATYCZNE)
      if (currentDrill === 'plank') {
        const avgShoulderY = (lShoulder.y + rShoulder.y) / 2;
        const bodyVerticalDiff = Math.abs(avgHipY - avgShoulderY);

        if (bodyVerticalDiff < 0.25) {
          statusBadge.className = 'badge status-ok';
          statusBadge.innerText = '💪 Świetnie! Trzymaj stabilny szkielet w desce.';
          const now = Date.now();
          if (now - lastPlankTick >= 1000) {
            lastPlankTick = now;
            reps += 1;
            repsBadge.innerText = 'CZAS: ' + reps + ' / ' + targetReps + ' s';
            sendToRN({ type: 'REP', reps, statusText: 'Utrzymano pozycję: ' + reps + 's' });
            if (reps >= targetReps) { finishExercise(); } else if (reps > 0 && reps % 5 === 0) { speakTTS(reps.toString()); }
          }
        } else {
          statusBadge.className = 'badge status-warn';
          statusBadge.innerText = '⚠️ Wyrównaj biodra z linią barków!';
        }
        canvasCtx.restore();
        return;
      }

      // 2. LOGIKA DLA POMPEK (PUSHUPS - DYNAMICZNE)
      if (currentDrill === 'pushups') {
        const isDown = smoothPrimaryAngle < 120;
        const isUp = smoothPrimaryAngle > 152;

        if (repStage === 'UP' && isDown) {
          downFramesCount++;
          currentRepMinAngle = Math.min(currentRepMinAngle, roundedAngle);
          if (downFramesCount >= 2) {
            repStage = 'DOWN';
            upFramesCount = 0;
            statusBadge.className = 'badge status-down';
            statusBadge.innerText = '⬇️ Dół pompki zaliczony (' + roundedAngle + '°)! Wyciśnij w górę!';
          }
        } else if (repStage === 'DOWN' && isUp) {
          upFramesCount++;
          const now = Date.now();
          if (upFramesCount >= 2 && now - lastRepTimestamp > 750) {
            repStage = 'UP';
            downFramesCount = 0;
            lastRepTimestamp = now;
            reps++;
            minAnglesPerRep.push(currentRepMinAngle);
            currentRepMinAngle = 180;
            repsBadge.innerText = 'POWTÓRZENIA: ' + reps + ' / ' + targetReps;
            statusBadge.className = 'badge status-ok';
            statusBadge.innerText = '✅ Pompka #' + reps + ' zaliczona!';
            sendToRN({ type: 'REP', reps, statusText: 'Pompka #' + reps });
            speakTTS(reps.toString());
            if (reps >= targetReps) { finishExercise(); } else if (reps > 0 && reps % 5 === 0) { speakTTS(reps.toString()); }
          }
        }
        canvasCtx.restore();
        return;
      }

      // 3. LOGIKA DLA PRZYSIAÓW / WYSKOKÓW / ZWINNOŚCI / ROZCIĄGANIA
      const baseDist = standingHipKneeDist || 0.22;
      const thighCompressionRatio = currentHipKneeVertDist / baseDist;

      const isKneeBent = smoothPrimaryAngle < 135 || thighCompressionRatio < 0.78;
      const isKneeStraight = smoothPrimaryAngle > 156 && thighCompressionRatio > 0.87;

      if (repStage === 'UP') {
        if (isKneeBent) {
          downFramesCount += 1;
          currentRepMinAngle = Math.min(currentRepMinAngle, roundedAngle);
          if (downFramesCount >= 2) {
            repStage = 'DOWN';
            upFramesCount = 0;
            statusBadge.className = 'badge status-down';
            statusBadge.innerText = '⬇️ Zejście zaliczone (' + roundedAngle + '°)! Teraz dynamicznie w górę!';
            sendToRN({ type: 'STATUS', reps, statusText: 'Faza dolna zaliczona – wyprostuj nogi!' });
          }
        } else {
          downFramesCount = 0;
          statusBadge.className = 'badge status-ok';
          statusBadge.innerText = '🦵 Zejdź nisko na nogach (poniżej 135°)';
        }
      } else if (repStage === 'DOWN') {
        currentRepMinAngle = Math.min(currentRepMinAngle, roundedAngle);

        if (isKneeStraight) {
          upFramesCount += 1;
          const now = Date.now();
          if (upFramesCount >= 2 && (now - lastRepTimestamp > 800)) {
            repStage = 'UP';
            downFramesCount = 0;
            lastRepTimestamp = now;
            reps += 1;
            minAnglesPerRep.push(currentRepMinAngle);
            currentRepMinAngle = 180;

            repsBadge.innerText = 'POWTÓRZENIA: ' + reps + ' / ' + targetReps;
            statusBadge.className = 'badge status-ok';
            statusBadge.innerText = '✅ Powtórzenie #' + reps + ' zaliczone!';
            sendToRN({ type: 'REP', reps, statusText: 'Zaliczone powtórzenie #' + reps });
            speakTTS(reps.toString());

            if (reps >= targetReps) { finishExercise(); } else if (reps > 0 && reps % 5 === 0) { speakTTS(reps.toString()); }
          }
        } else {
          upFramesCount = 0;
        }
      }

      canvasCtx.restore();
    }

    const pose = new Pose({
      locateFile: (file) => 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/' + file
    });

    function applyPoseOptions(complexityLevel) {
      pose.setOptions({
        modelComplexity: complexityLevel, // 1 = Full, 2 = Heavy
        smoothLandmarks: true,            // Wygładzanie czasowe zapobiegające drganiom szkieletu
        enableSegmentation: false,
        minDetectionConfidence: 0.50,     // Obniżony próg pewności (nie gubi klatek w ruchu)
        minTrackingConfidence: 0.50
      });
    }

    applyPoseOptions(currentComplexity);
    pose.onResults(onResults);

    function toggleModelComplexity() {
      currentComplexity = currentComplexity === 1 ? 2 : 1;
      applyPoseOptions(currentComplexity);
      const label = currentComplexity === 2 ? 'HEAVY (Maks. Precyzja)' : 'FULL (Szybki + Smooth)';
      if (modelBtn) modelBtn.innerText = '🧠 Model: ' + label;
      if (modelBadge) modelBadge.innerText = 'AI: ' + (currentComplexity === 2 ? 'HEAVY' : 'FULL');
    }

    async function applyMinZoom(stream) {
      try {
        const track = stream.getVideoTracks()[0];
        if (track && track.getCapabilities) {
          const caps = track.getCapabilities();
          if (caps.zoom && typeof caps.zoom.min === 'number') {
            await track.applyConstraints({ advanced: [{ zoom: caps.zoom.min }] });
          }
        }
      } catch (e) {}
    }

    async function switchWideLens() {
      if (backCameras.length <= 1) return;
      currentCamIndex = (currentCamIndex + 1) % backCameras.length;
      const targetDeviceId = backCameras[currentCamIndex].deviceId;
      if (lensBtn) {
        lensBtn.innerText = '🔍 Obiektyw ' + (currentCamIndex + 1) + '/' + backCameras.length;
      }
      await startCamera(targetDeviceId);
    }

    async function startCamera(specificDeviceId = null) {
      try {
        if (currentStream) {
          currentStream.getTracks().forEach(t => t.stop());
        }

        const videoConstraints = specificDeviceId
          ? { deviceId: { exact: specificDeviceId }, width: { ideal: 480 }, height: { ideal: 640 } }
          : { facingMode: '${cameraMode}', width: { ideal: 480 }, height: { ideal: 640 } };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false
        });

        currentStream = stream;
        await applyMinZoom(stream);

        if ('${cameraMode}' === 'environment' && backCameras.length === 0 && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          backCameras = devices.filter(d => d.kind === 'videoinput' && (d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear') || d.label.toLowerCase().includes('environment') || d.label.toLowerCase().includes('0')));
          if (backCameras.length > 1 && lensBtn) {
            lensBtn.style.display = 'block';
            lensBtn.innerText = '🔍 Kąt (1/' + backCameras.length + ')';
          }
        }

        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          processVideo();
        };
      } catch (err) {
        statusBadge.innerText = 'Błąd kamery: ' + err.message;
      }
    }

    async function processVideo() {
      if (!isFinished && videoElement.readyState >= 2) {
        await pose.send({ image: videoElement });
      }
      if (!isFinished) {
        requestAnimationFrame(processVideo);
      }
    }

    startCamera();
  </script>
</body>
</html>
  `;

  // Obsługa podglądu w przeglądarce PC (Platform.OS === 'web'), gdzie natywny komponent WebView nie jest wspierany
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallbackBox}>
        <Text style={styles.webTitle}>🧬 Skaner Biomechaniczny AI (MediaPipe Pose FULL)</Text>
        <Text style={styles.webSub}>
          Tryb: {drillType.toUpperCase()} • Cel: {targetReps} {drillType === 'plank' ? 'sek.' : 'powt.'} • Wygładzanie czasowe: WŁĄCZONE
        </Text>
        <View style={styles.webLightHint}>
          <Text style={styles.webLightHintText}>
            💡 Czujnik ekspozycji aktywny: Upewnij się, że źródło światła jest przed zawodnikiem (nie stój na tle okna).
          </Text>
        </View>

        <View style={styles.webSimCounterBox}>
          <Text style={styles.webSimCounterVal}>
            {webSimReps} / {targetReps}
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>Symulacja powtórzeń w przeglądarce PC</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <TouchableOpacity
            style={styles.webActionBtn}
            onPress={() => {
              const next = webSimReps + 1;
              setWebSimReps(next);
              onRepCountChange?.(next, `Zaliczone powtórzenie #${next}`);
              if (next >= targetReps) {
                onComplete({
                  reps: next,
                  score: 95,
                  asymmetryIndex: 2.8,
                  detectedErrors: [],
                });
              }
            }}
          >
            <Text style={styles.webActionBtnText}>+ Symuluj Powtórzenie AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.webActionBtn, { backgroundColor: '#22c55e' }]}
            onPress={() =>
              onComplete({
                reps: targetReps,
                score: 96,
                asymmetryIndex: 2.4,
                detectedErrors: [],
              })
            }
          >
            <Text style={[styles.webActionBtnText, { color: '#0f172a' }]}>🏆 Zakończ i Nalicz XP</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent, baseUrl: 'https://localhost' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        androidLayerType="hardware"
        mixedContentMode="always"
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#00FF66" />
            <Text style={styles.loaderText}>Kalibracja Skanera AI (Model FULL + Czujnik Światła)...</Text>
          </View>
        )}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'SWITCH_CAMERA') {
              setCurrentFacing(prev => prev === 'front' ? 'back' : 'front');
            } else if (data.type === 'REP' || data.type === 'STATUS') {
              onRepCountChange?.(data.reps, data.statusText);
            } else if (data.type === 'COMPLETE') {
              onComplete(data.metrics);
            }
          } catch (e) {
            // ignoruj
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%', backgroundColor: '#020617', overflow: 'hidden', borderRadius: 12 },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: '#00FF66', marginTop: 10, fontSize: 13, fontWeight: 'bold' },

  webFallbackBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  webTitle: { fontSize: 18, fontWeight: 'bold', color: '#38bdf8', textAlign: 'center' },
  webSub: { fontSize: 13, color: '#cbd5e1', marginTop: 6, textAlign: 'center' },
  webLightHint: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    maxWidth: 480,
  },
  webLightHintText: { color: '#fde68a', fontSize: 12, textAlign: 'center' },
  webSimCounterBox: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#38bdf8',
    marginTop: 20,
    alignItems: 'center',
  },
  webSimCounterVal: { fontSize: 32, fontWeight: '900', color: '#fff' },
  webActionBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  webActionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
