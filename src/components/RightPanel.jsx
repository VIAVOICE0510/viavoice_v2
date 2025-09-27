import React, { useRef, useEffect, useState } from 'react';
export default function RightPanel() {
const [trend, setTrend] = useState(null);
const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
const [youText, setYouText] = useState("");
const [isSpeaking, setIsSpeaking] = useState(false);
const [isRunning, setIsRunning] = useState(false); // آیا روند در حال اجرا است
const audioRef = useRef(null);


useEffect(() => {
  fetch("https://totivar.com/api/trends/13")
    .then(res => res.json())
    .then(data => {
      console.log(data)      
      setTrend(data);
      if (data.sentences && data.sentences.length > 0) {
        setCurrentSentenceIndex(0);
        setYouText(data.sentences[0]);
      }
    })
    .catch(err => console.error("خطا در گرفتن روند:", err));
}, []);

const handleStartLearning = async () => {
  if (!trend || isRunning) return;
  setIsRunning(true);

  const guides = trend.guides || [];
  const sentences = trend.sentences || [];

  for (let i = 0; i < sentences.length; i++) {
    // 1) انتخاب راهنما
    let guideUrl = "";
    if (i === 0 && guides.length >= 1) {
      guideUrl = guides[0]; // راهنمای اول فقط قبل از جمله اول
    } else if (guides.length >= 2) {
      guideUrl = guides[1]; // راهنمای دوم قبل از بقیه جملات
    }

    if (guideUrl) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      audioRef.current = new Audio(`https://totivar.com/${guideUrl}`);
      setIsSpeaking(true);

      await new Promise(resolve => {
        audioRef.current.onended = () => { setIsSpeaking(false); resolve(); };
        audioRef.current.play().catch(() => resolve());
      });
    }

    // 2) نمایش و خواندن جمله
    const sentence = sentences[i];
    setCurrentSentenceIndex(i);
    setYouText(sentence);

    const sentenceAudio = trend.sentencesAudio?.[i] || null;
    if (sentenceAudio) {
      await new Promise(resolve => {
        audioRef.current = new Audio(`https://totivar.com/${sentenceAudio}`);
        setIsSpeaking(true);
        audioRef.current.onended = () => { setIsSpeaking(false); resolve(); };
        audioRef.current.play().catch(() => resolve());
      });
    } else if ("speechSynthesis" in window) {
      await new Promise(resolve => {
        const utter = new SpeechSynthesisUtterance(sentence);
        setIsSpeaking(true);
        utter.onend = () => { setIsSpeaking(false); resolve(); };
        window.speechSynthesis.speak(utter);
      });
    }

    // 3) 5 ثانیه صبر
    await new Promise(r => setTimeout(r, 5000));
  }

  setTrend(prev => ({ ...prev, completed: true }));
  setIsRunning(false);
};




  const [pageName , setPageName]=useState("moror");
  const timelineRef = useRef(null);
  const lineRightRef = useRef(null);
  const currentTimeRef = useRef(null);
  // استیت‌ها
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState("");        // جمله‌ای که کاربر ضبط کرده
  const [comparisonResult, setComparisonResult] = useState([]); // نتیجه مقایسه کلمه به کلمه
  const [userEvents, setUserEvents] = useState([]); // رویدادهای کاربر
  const drawAxisRef= useRef(null);//برای اجرای دوبارۀ دستورات تایم لاین

  // timeline state (ایونت‌های اولیه)
  const [timelineEvents, setTimelineEvents] = useState([
    { date: new Date("2025-08-18T07:41:41"), label: "Sign Up" },
    { date: new Date("2025-09-02T14:45:00"), label: "Login" },
    { date: new Date("2025-10-30T09:00:00"), label: "Buy Plan" }
  ]);

  // REF برای نگهداری آخرین timelineEvents داخل closureهای useEffect
  const timelineEventsRef = useRef(timelineEvents);
  useEffect(() => {
    timelineEventsRef.current = timelineEvents;
  }, [timelineEvents]);

  // تابع پخش ویس
  const handlePlayVoice = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(`${process.env.PUBLIC_URL}/voices/echo-2025-09-02_09-09-29.mp3`);
    }

    setIsSpeaking(true);  // آدمک شروع به حرکت
    audioRef.current.play().catch(err => console.log('خطا در پخش صوت:', err));
    audioRef.current.onended = () => setIsSpeaking(false); // آدمک متوقف می‌شود
  };
  const handleSpeakYou = (sentence) => {
    if (!sentence) return;
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
    // setTimelineEvents(p=>[...p,sentence]);
    const wesentence ={
        date: new Date(),
        label: sentence,
        isUser: true
    }
    setTimelineEvents(p=>[...p,wesentence])
  };
  // تابع ضبط
  const handleStartRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("مرورگر شما از ضبط صوت پشتیبانی نمی‌کند");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;

      // ذخیره جمله‌ی واقعی کاربر
      setRecordedText(transcript);

      // مقایسه کلمه به کلمه با جمله ثابت
      const result = compareTexts(transcript, youText); // youText = "how are you"
      setComparisonResult(result);

      // پخش ویس درست/غلط
      const allCorrect = result.every(r => r.isCorrect);
      const feedbackAudio = new Audio(
        allCorrect 
          ? `${process.env.PUBLIC_URL}/voices/ali.mp3` 
          : `${process.env.PUBLIC_URL}/voices/bad.mp3`
      );
      feedbackAudio.play().catch(err => console.log('خطا در پخش صوت:', err));

      // اضافه کردن رویداد کاربر به تایم‌لاین با flag isUser (زمان دقیق همین لحظه)
      const userEvent = {
        date: new Date(),
        label: transcript,
        isUser: true
      };
      // setTimelineEvents(prev => [...prev, userEvent]); // React state-safe
      setTimelineEvents(prev => [...prev, userEvent]); // React state-safe
      // رسم مجدد به‌وسیله useEffect وابسته به timelineEvents انجام خواهد شد
    };
    recognition.start();
  };

  // نرمالایز متن (حروف کوچک و حذف فاصله اضافی)
  function normalizeText(text) {
    return text.toLowerCase().trim().replace(/\s+/g, " ");
  }

  // مقایسه کلمه به کلمه
  function compareTexts(userText, referenceText) {
    const userWords = normalizeText(userText).split(" ");
    const refWords = normalizeText(referenceText).split(" ");

    const maxLen = Math.max(userWords.length, refWords.length);

    const result = [];
    for (let i = 0; i < maxLen; i++) {
      result.push({
        text: refWords[i] || "",      // کلمه درست از دیتابیس
        userWord: userWords[i] || "", // کلمه واقعی که کاربر گفته
        isCorrect: userWords[i].toLowerCase() === refWords[i].toLowerCase()
      });
    }
    return result;
  }

  // ---------- MAIN useEffect: mount canvas, listeners و drawAxis تعریف می‌شود ----------
  useEffect(() => {

    const canvas = timelineRef.current;
    const ctx = canvas.getContext('2d');
    const canvasR = lineRightRef.current;
    const ctxR = canvasR.getContext('2d');

    const BASE_YEAR = new Date().getFullYear() - 1;
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months   = ["Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const L_MINUTE = 6,  W_MINUTE = 1;
    const L_HOUR   = 8,  W_HOUR   = 1.2;
    const L_DAY    = 10, W_DAY    = 1.5;
    const L_MONTH  = 14, W_MONTH  = 2;
    const L_YEAR   = 20, W_YEAR   = 2.5;

    let scale = 20;
    let offset = 0;
    let isDragging = false;
    let dragStartY = 0;
    let velocity = 0;
    let lastMoveTime = null;
    let momentumID = null;
    let lastTouchDist = null;

    function drawTick(x, y, len, width) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.lineWidth = width; ctx.stroke(); }

    // drawEvents حالا events را بعنوان پارامتر می‌گیرد (و از ref به عنوان fallback استفاده می‌کند)
    function drawEvents(axisX, mid, events = null) {
      const evList = events || timelineEventsRef.current || [];
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      evList.forEach(ev => {
        // guard: ev.date must be Date-like
        const evDate = (ev && ev.date) ? new Date(ev.date) : new Date();
        const diffMin = (evDate - new Date(`${BASE_YEAR}-01-01T00:00:00`)) / 60000;
        const y = canvas.height - (diffMin * scale + offset);
        ctx.fillStyle = ev && ev.isUser ? "#00FF00" : "#FFD700";
        ctx.fillText(ev.label, axisX + 25, y);
      });
    }

    // drawAxis accepts events param (latest timelineEvents can be passed)
    function drawAxis(events = null) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const axisX = 10;
      ctx.strokeStyle = '#ba4102';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(axisX, 0);
      ctx.lineTo(axisX, canvas.height);
      ctx.stroke();

      const mid = canvas.height / 2;
      const startMinute = Math.floor((-mid - offset) / scale) - 2;
      const endMinute   = Math.ceil((mid - offset) / scale) + 2;

      const showHour   = scale >= 0.09;
      const showDay    = scale >= 0.002;
      const showWeek   = scale <0.04 && scale >=0.021;
      const showMonth  = scale < 0.021 && scale>0.007;
      const showYear   = scale < 0.007 && scale>0.0012;

      const now = new Date();
      const baseDate = new Date(now.getFullYear() - 1, 0, 1);
      const endDate  = new Date(now.getFullYear() + 4, 0, 1);

      ctx.fillStyle   = '#be7749';
      ctx.textAlign   = 'left';
      ctx.textBaseline = 'middle';

      for (let m = startMinute; m <= endMinute; m++) {
        const y = canvas.height - (mid + m * scale + offset);
        const curDate = new Date(baseDate.getTime() + m * 60000);
        if (curDate < baseDate || curDate >= endDate) continue;

        const weekday = weekdays[curDate.getDay()];
        const monthDay = curDate.getDate();
        const monthName = months[curDate.getMonth()];
        const year = curDate.getFullYear();
        const minutes = curDate.getMinutes();
        const hours = curDate.getHours();
        const isDayBoundary   = hours === 0 && minutes === 0;
        const isWeekBoundary  = isDayBoundary;
        const isMonthBoundary = isDayBoundary;
        const isYearBoundary  = isDayBoundary && monthDay === 1;

        if (minutes !== 0) {
          if (scale >= 14) { drawTick(axisX, y, L_MINUTE, W_MINUTE); ctx.font = '10px Arial'; ctx.fillText("." + minutes, axisX + L_MINUTE + 4, y); }
          else if (scale >= 4.575 && minutes % 5 === 0) { drawTick(axisX, y, L_MINUTE, W_MINUTE); ctx.font = '10px Arial'; ctx.fillText("." + minutes, axisX + L_MINUTE + 4, y); }
          else if (scale >= 2.70 && minutes % 10 === 0) { drawTick(axisX, y, L_MINUTE, W_MINUTE); ctx.font = '10px Arial'; ctx.fillText("." + minutes, axisX + L_MINUTE + 4, y); }
          else if (scale <= 2.61 && scale >= 1.4 && minutes % 30 === 0) { drawTick(axisX, y, L_MINUTE, W_MINUTE); ctx.font = '10px Arial'; ctx.fillText("." + minutes, axisX + L_MINUTE + 4, y); }
          continue;
        }

        if (showHour && minutes === 0 && !isDayBoundary) {
          if (scale > 1.30) { drawTick(axisX, y, L_HOUR, W_HOUR); ctx.font = '12px Arial'; ctx.fillText(`${hours}:00 ${weekday} ${monthDay} ${monthName} ${year}`, axisX + L_HOUR + 6, y); }
          else if (scale > 0.7) { if (hours % 1 === 0) { drawTick(axisX, y, L_HOUR, W_HOUR); ctx.font = '12px Arial'; ctx.fillText(`${hours}:00`, axisX + L_HOUR + 6, y); } }
          else if (scale > 0.35) { if (hours % 3 === 0) { drawTick(axisX, y, L_HOUR, W_HOUR); ctx.font = '12px Arial'; ctx.fillText(`${hours}:00`, axisX + L_HOUR + 6, y); } }
          else if (scale > 0.175) { if (hours % 6 === 0) { drawTick(axisX, y, L_HOUR, W_HOUR); ctx.font = '12px Arial'; ctx.fillText(`${hours}:00`, axisX + L_HOUR + 6, y); } }
          else { if (hours % 12 === 0) { drawTick(axisX, y, L_HOUR, W_HOUR); ctx.font = '12px Arial'; ctx.fillText(`${hours}:00`, axisX + L_HOUR + 6, y); } }
          continue;
        }

        if (showDay && isDayBoundary) {
          drawTick(axisX, y, L_DAY, W_DAY);
          if (monthDay === 1 && scale>=0.04) { 
            ctx.font = 'bold 16px Arial'; 
            ctx.fillText(`${weekday} ${monthDay} ${monthName} ${year}`, axisX + L_DAY + 8, y);
          } else { 
            ctx.font = '13px Arial'; 
            if (scale >= 0.04 && scale <= 0.09) { ctx.fillText(`${weekday} ${monthDay}`, axisX + L_DAY + 8, y); } 
            else if(scale>0.09) { ctx.fillText(`${weekday} ${monthDay} ${monthName} ${year}`, axisX + L_DAY + 8, y); } 
          }
        }

        if (showWeek && isWeekBoundary) {
          drawTick(axisX, y, L_MONTH, W_MONTH);
          if(scale>0.01 && scale<0.04){
            if(weekday==="Sun"){
              ctx.font = 'bold 14px Arial';        
              ctx.fillText(`${weekday} ${monthDay} ${monthName} ${year}`, axisX + L_MONTH + 8, y);  
            } else {
              ctx.font = '14px Arial';        
              ctx.fillText(`${weekday} ${monthDay}`, axisX + L_MONTH + 8, y);
            }
          }      
        }

        if (showMonth && isMonthBoundary) {
          drawTick(axisX, y, L_MONTH, W_MONTH);
          if(monthDay===1){
            ctx.font = 'bold 16px Arial';
            ctx.fillText(`${monthName} ${year}`, axisX + L_MONTH + 8, y);
          } else {
            ctx.font = '14px Arial';
            if(scale <=0.021 && scale >0.014){ ctx.fillText(`${monthDay}`, axisX + L_MONTH + 8, y); }
            if(scale<0.014 && monthDay%5===0 && scale>0.009){ ctx.fillText(`${monthDay}`, axisX + L_MONTH + 8, y); }
            if(scale<0.009 && scale>0.007 && monthDay%10===0){ ctx.fillText(`${monthDay}`, axisX + L_MONTH + 8, y); }
          }
        }

        if (showYear && isYearBoundary) {
          drawTick(axisX, y, L_YEAR, W_YEAR);
          if(curDate.getMonth() === 0){
            ctx.font = 'bold 20px Arial';
            ctx.fillText(`${year}`, axisX + L_YEAR + 10, y);
          } else {
            ctx.font = '18px Arial';
            ctx.fillText(`${monthName}`, axisX + L_YEAR + 10, y);
          }
        }
      }

      // رسم ایونت‌ها (از پارامتر events یا از ref)
      drawEvents(axisX, canvas.height / 2, events);

      ctx.strokeStyle = "red";
      drawTick(axisX, canvas.height / 2, 10, 6);
      ctx.strokeStyle = "#ba4102";
    }

    function applyMomentum() {
      if (Math.abs(velocity) > 0.1) {
        offset += velocity;
        velocity *= 0.95;
        drawAxisRef.current && drawAxisRef.current(timelineEventsRef.current);
        momentumID = requestAnimationFrame(applyMomentum);
      } else { 
        if (momentumID) cancelAnimationFrame(momentumID); 
        momentumID = null; 
      }
    }

    function getTouchDistance(touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx*dx + dy*dy);
    }

    // Mouse wheel handler (kept identical logic)
const wheelHandler = (e) => {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const mouseY = e.clientY - rect.top;

  // مختصات جهان نقطه موس قبل از زوم
  const worldY = (canvas.height - mouseY - offset) / scale;

  // تعیین ضریب زوم
  const zoom = e.deltaY < 0 ? 1.1 : 0.9;
  const newScale = Math.max(0.0012635, Math.min(scale * zoom, 100));

  // offset جدید برای ثابت نگه داشتن نقطه موس
  offset = canvas.height - (worldY * newScale + mouseY);
  // offset = canvas.height - (worldY * newScale) - mouseY;

  // اعمال scale جدید
  scale = newScale;

  drawAxisRef.current && drawAxisRef.current(timelineEventsRef.current);
};


    canvas.addEventListener('wheel', wheelHandler, { passive: false });

    // Mouse drag handlers
    const mouseDownHandler = (e) => { 
      isDragging = true; dragStartY = e.clientY;
       lastMoveTime = performance.now();
        velocity = 0; };
    const mouseMoveHandler = (e) => {
      if (!isDragging) return;
      const now = performance.now();
      const dy = e.clientY - dragStartY;
      offset -= dy;
      drawAxisRef.current && drawAxisRef.current(timelineEventsRef.current);
      velocity = -dy / (now - (lastMoveTime || now)) * 16;
      dragStartY = e.clientY;
      lastMoveTime = now;
    };
    const mouseUpHandler = () => { isDragging = false; if (Math.abs(velocity) > 0.5) applyMomentum(); };

    canvas.addEventListener('mousedown', mouseDownHandler);
    canvas.addEventListener('mousemove', mouseMoveHandler);
    ['mouseup','mouseleave'].forEach(ev => canvas.addEventListener(ev, mouseUpHandler));

    // Touch handlers (kept identical logic)
    const touchStartHandler = (e) => {
      if (e.touches.length === 1) { isDragging = true; dragStartY = e.touches[0].clientY; lastMoveTime = performance.now(); velocity = 0; }
      else if (e.touches.length === 2) { isDragging = false; lastTouchDist = getTouchDistance(e.touches); }
    };
    const touchMoveHandler = (e) => {
      if (e.touches.length === 1 && isDragging) {
        const now = performance.now();
        const dy = e.touches[0].clientY - dragStartY;
        offset -= dy;
        drawAxisRef.current && drawAxisRef.current(timelineEventsRef.current);
        velocity = -dy / (now - (lastMoveTime || now)) * 16;
        dragStartY = e.touches[0].clientY;
        lastMoveTime = now;
      } else if (e.touches.length === 2) {
        const newDist = getTouchDistance(e.touches);
        if (lastTouchDist) {
          const zoom = newDist / lastTouchDist;
          const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          const worldY = (centerY - canvas.height / 2 - offset) / scale;
          const newScale = Math.max(0.0005, Math.min(scale * zoom, 100));
          offset = centerY - canvas.height / 2 - worldY * newScale;
          scale = newScale;
          drawAxisRef.current && drawAxisRef.current(timelineEventsRef.current);
        }
        lastTouchDist = newDist;
      }
      e.preventDefault();
    };
    const touchEndHandler = (e) => { if (e.touches.length < 2) lastTouchDist = null; if (e.touches.length === 0) { isDragging = false; if (Math.abs(velocity) > 0.5) applyMomentum(); } };
    const touchCancelHandler = () => { isDragging = false; lastTouchDist = null; };

    canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
    canvas.addEventListener('touchend', touchEndHandler);
    canvas.addEventListener('touchcancel', touchCancelHandler);

    // ثبت drawAxisRef برای استفادهٔ بیرونی
    drawAxisRef.current = (events = null) => drawAxis(events);

    // Line right drawing (unchanged)
    ctxR.beginPath(); ctxR.moveTo(canvasR.width-17, canvasR.height); ctxR.lineTo(canvasR.width-17, canvasR.height/2); ctxR.strokeStyle="#ba4102"; ctxR.lineWidth=2; ctxR.stroke();
    ctxR.beginPath(); ctxR.moveTo(canvasR.width-16, canvasR.height/2); ctxR.lineTo(0, canvasR.height/2); ctxR.strokeStyle="#ba4102"; ctxR.lineWidth=2; ctxR.stroke();

    // نمایش نقطۀ اکنون روی تایم لاین (همون منطق شما)
function centerOnNow() {
  const now = new Date();
  const baseDate = new Date(BASE_YEAR, 0, 1);
  const diffMs = now - baseDate;
  const totalMinutes = diffMs / 60000; // از کسری دقیقه استفاده کن برای روان بودن
  offset = - totalMinutes * scale;
  drawAxisRef.current && drawAxisRef.current(timelineEventsRef.current);
}


    // initial draw + center now
    drawAxisRef.current && drawAxisRef.current(timelineEventsRef.current);
    centerOnNow();
    drawAxisRef.current && drawAxisRef.current(timelineEventsRef.current);

    // === update currentTime every second and when minute changes, centerOnNow ===
    // let lastMinute = (new Date()).getMinutes();
    function updateClockAndMaybeCenter() {
  const now = new Date();

  // نمایش زمان جاری در DOM
  const weekday = weekdays[now.getDay()];
  const month   = months[now.getMonth()];
  const day     = now.getDate();
  const year    = now.getFullYear();
  const hours   = String(now.getHours()).padStart(2,'0');
  const minutes = String(now.getMinutes()).padStart(2,'0');
  const seconds = String(now.getSeconds()).padStart(2,'0');

  if (currentTimeRef.current) {
    currentTimeRef.current.textContent =
      `${weekday} ${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
  }

  // محاسبه آفست دقیق بر اساس ثانیه جاری
  const baseDate = new Date(BASE_YEAR, 0, 1); // شروع از اول ژانویه سال پایه
  const diffMs = now - baseDate;
  const totalMinutes = diffMs / 60000; // دقیقه + کسری ثانیه‌ها
  offset = - totalMinutes * scale;

  // بازکشی تایم‌لاین
  drawAxisRef.current && drawAxisRef.current(timelineEventsRef.current);
}


    updateClockAndMaybeCenter();
    const clockInterval = setInterval(updateClockAndMaybeCenter, 1000); // هر ثانیه چک می‌کنیم

    // === جستجوی ایونت‌ها و حرکت تایم‌لاین ===
    const searchInput = document.getElementById('searchw');
    if (searchInput) {
      const handleSearch = () => {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;

        // پیدا کردن اولین ایونتی که متنش شامل سرچ باشه
        const matchedEvent = (timelineEventsRef.current || []).find(ev => ev.label.toLowerCase().includes(query));
        if (!matchedEvent) return;

        const baseDate = new Date(BASE_YEAR, 0, 1); // همان BASE_YEAR تایم‌لاین
        const totalMinutes = Math.floor((matchedEvent.date - baseDate) / 60000);
        const targetOffset =canvas.height  -(totalMinutes * scale);

        // حرکت نرم تایم‌لاین
        const smoothMove = () => {
          const diff = targetOffset - offset;
          if (Math.abs(diff) < 0.5) {
            offset = targetOffset;
            drawAxisRef.current && drawAxisRef.current(timelineEventsRef.current);
            return;
          }
          offset += diff * 0.1; // حرکت نرم
          drawAxisRef.current && drawAxisRef.current(timelineEventsRef.current);
          requestAnimationFrame(smoothMove);
        };

        smoothMove();
      };

      searchInput.addEventListener('change', handleSearch);
      searchInput.addEventListener('keyup', e => { if(e.key === "Enter") handleSearch(); });

      // cleanup listeners مربوط به search در cleanup کلی انجام می‌شود
    }

    // ------------- cleanup on unmount -------------
    return () => {
      // remove listeners
      canvas.removeEventListener('wheel', wheelHandler);
      canvas.removeEventListener('mousedown', mouseDownHandler);
      canvas.removeEventListener('mousemove', mouseMoveHandler);
      canvas.removeEventListener('mouseup', mouseUpHandler);
      canvas.removeEventListener('mouseleave', mouseUpHandler);
      canvas.removeEventListener('touchstart', touchStartHandler);
      canvas.removeEventListener('touchmove', touchMoveHandler);
      canvas.removeEventListener('touchend', touchEndHandler);
      canvas.removeEventListener('touchcancel', touchCancelHandler);

      // cancel any running momentum
      if (momentumID) cancelAnimationFrame(momentumID);
      // clear clock interval
      clearInterval(clockInterval);
    };
  // deps empty — mount once
  }, []);

  // ---------- NEW useEffect — هر بار timelineEvents تغییر کرد، drawAxis را با آخرین ایونت‌ها صدا بزن ----------
  useEffect(() => {
    // به‌روزرسانی ref قبلاً انجام شده؛ فقط رسم‌کن
    if (drawAxisRef.current) {
      drawAxisRef.current(timelineEventsRef.current || []);
    }
  }, [timelineEvents]);

  return (
    <div className="col-xs-12 col-sm-12 col-md-3" id="parent">
      <div id="btnschild">  
        {/* نام روند */}
        <div className='row mb-2'>
          <div className='col text-center'>
          {trend && (
            <p className='text-danger'>
              {trend.trendType === 1 ? "مرور" : trend.trendType === 2 ? "آزمون" : "تمرین"}
            </p>
          )}
            <p className='text-white text-center'>
              {trend ? trend.name : "در حال بارگذاری..."}
            </p>
          </div>
        </div>
        <div className='row mb-2'>
          <div className='col text-center'>
            {/* دکمه شروع یادگیری با آدمک */}
            <button
  className="btn text-white me-2 mt-2"
  onClick={handleStartLearning} // اجرای کل روند از اینجا
  disabled={isRunning || !trend} // غیر فعال وقتی در حال اجرا یا trend لود نشده
  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
>
  <svg width="30" height="30" viewBox="0 0 100 100">
    {/* سر آدمک */}
    <circle cx="50" cy="50" r="40" fill="#f4c542" stroke="#333" strokeWidth="2"/>
    {/* چشم‌ها */}
    <circle cx="35" cy="40" r="5" fill="#000"/>
    <circle cx="65" cy="40" r="5" fill="#000"/>
    {/* دهان */}
    <rect
      x="35"
      y={isSpeaking ? "60" : "65"}   // حرکت دهان بالا و پایین
      width="30"
      height={isSpeaking ? "10" : "5"}
      fill="#900"
      rx="2"
    />
  </svg>
  <span style={{ marginLeft: 8 }}>
    {isRunning ? "در حال یادگیری..." : "شروع"}
  </span>
            </button>

          </div>
        </div>

          <div className='row mb-2'>
            <div className='col text-center'>
              {/* نمایش جمله فعلی */}
              <p style={{ marginTop: 12, fontSize: 18 }}>
                {youText}
              </p>
            </div>
          </div>
      <div style={{ marginTop: '10px' }}>
        {pageName!="moror" ? 
        <button className="btn text-white" onClick={handleStartRecording} disabled={isRecording}>
          {isRecording ? "Recording..." : "Start Recording"}
        </button>
        :
        ""
        }

        <div style={{ marginTop: '10px' }}>
          {comparisonResult.length > 0 ? (
            comparisonResult.map((w, i) => (
              <span
                key={i}
                style={{
                  color: w.isCorrect ? "green" : "red",
                  marginRight: "4px"
                }}
              >
                {w.userWord || w.text} {/* نمایش کلمه واقعی کاربر */}
              </span>
            ))
          ) : (
            <span>{recordedText}</span> /* قبل از مقایسه */
          )}
        </div>
      </div>

        </div>

      <div id="parentChild">
        <canvas ref={timelineRef} id="timeline" height="800" width="160"></canvas>
      </div>
      <div id="pright">
        <canvas ref={lineRightRef} id="lineRight" height="800" width="200"></canvas>
      </div>
      <span ref={currentTimeRef} id="currentTime"></span>
      <span id="now">NOW</span>
      <div id="search" className="p-3">
        <div id="dSearch">
          <span id="spansearch">Search</span>
          <form className="d-flex p-3 justify-content-between">
            <div className="col-10">
              <div className="mb-3">
                <input id="searchw" type="text" className="form-control" placeholder="" />
              </div>
            </div>
            <div className="col-2 me-2">
              <div className="mb-3">
                <input id="date" type="date" className="form-control" placeholder="" />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
