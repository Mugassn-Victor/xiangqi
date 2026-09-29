const VIDEO_URL = "./video.mp4";
const FPS = 30;
const clips = [
  ["片头 / 普通绝杀", 0.00, 6.06], ["绝杀特效 02", 6.06, 11.60],
  ["绝杀特效 03", 11.60, 18.20], ["绝杀特效 04", 18.20, 23.67],
  ["绝杀特效 05", 23.67, 28.97], ["绝杀特效 06", 28.97, 34.77],
  ["绝杀特效 07", 34.77, 40.53], ["绝杀特效 08", 40.53, 47.03],
  ["绝杀特效 09", 47.03, 53.97], ["绝杀特效 10", 53.97, 56.37],
  ["绝杀特效 11", 56.37, 65.70], ["绝杀特效 12", 65.70, 71.47],
  ["绝杀特效 13", 71.47, 76.33], ["绝杀特效 14", 76.33, 78.93],
  ["绝杀特效 15", 78.93, 85.20], ["绝杀特效 16", 85.20, 89.57],
  ["绝杀特效 17", 89.57, 97.50], ["追加特效 18", 97.50, 103.23],
  ["追加特效 19", 103.23, 108.37], ["最后隐藏特效", 108.37, 115.215]
].map(([name, start, end]) => ({ name, start, end }));
const speeds = [0.25, 0.5, 1, 1.5, 2];

const $ = (id) => document.getElementById(id);
const video = $("video");
const progress = $("progress");
let index = 0, speed = 1, loop = true, raf = 0;

video.src = VIDEO_URL;

function format(value) {
  const minutes = Math.floor(value / 60);
  const seconds = (value % 60).toFixed(2).padStart(5, "0");
  return `${String(minutes).padStart(2, "0")}:${seconds}`;
}
function clip() { return clips[index]; }
function relativeTime() { return Math.max(0, video.currentTime - clip().start); }
function frame() { return Math.floor(relativeTime() * FPS); }

function updateUI() {
  const item = clip();
  const ratio = Math.min(1, relativeTime() / (item.end - item.start));
  progress.value = ratio;
  $("clipNumber").textContent = String(index + 1).padStart(2, "0");
  $("clipTitle").textContent = item.name;
  $("frameBadge").textContent = `FRAME ${String(frame()).padStart(4, "0")}`;
  $("currentTime").textContent = `${format(video.currentTime)} · 第 ${frame()} 帧`;
  $("clipRange").textContent = `${format(item.start)} – ${format(item.end)}`;
  $("play").textContent = video.paused ? "▶ 播放" : "❚❚ 暂停";
  $("centerPlay").textContent = video.paused ? "▶" : "❚❚";
  document.querySelectorAll(".clip-item").forEach((button, i) => button.classList.toggle("active", i === index));
}

function monitor() {
  const item = clip();
  if (video.currentTime >= item.end) {
    if (loop) {
      video.currentTime = item.start;
      video.play().catch(showError);
    } else {
      video.pause();
      video.currentTime = item.end - 1 / FPS;
    }
  }
  updateUI();
  if (!video.paused) raf = requestAnimationFrame(monitor);
}

async function play(restart = false) {
  const item = clip();
  cancelAnimationFrame(raf);
  if (restart || video.currentTime < item.start || video.currentTime >= item.end) video.currentTime = item.start;
  video.playbackRate = speed;
  try { await video.play(); raf = requestAnimationFrame(monitor); }
  catch (error) { showError(); }
}
function pause() { video.pause(); cancelAnimationFrame(raf); updateUI(); }
function togglePlay() { video.paused ? play(false) : pause(); }
function selectClip(next) {
  pause(); index = (next + clips.length) % clips.length;
  video.currentTime = clip().start; progress.value = 0; updateUI();
}
function stepFrame(direction) {
  pause();
  video.currentTime = Math.max(clip().start, Math.min(clip().end - 1 / FPS, video.currentTime + direction / FPS));
  updateUI();
}
function showError() { $("loading").classList.add("hidden"); $("errorBox").classList.remove("hidden"); }

function renderList() {
  $("clipList").innerHTML = clips.map((item, i) => `
    <button class="clip-item ${i === index ? "active" : ""}" data-index="${i}">
      <span class="number">${String(i + 1).padStart(2, "0")}</span>
      <span class="clip-name">${item.name}<small>${format(item.start)} – ${format(item.end)} · ${Math.round((item.end-item.start)*FPS)}帧</small></span>
      <span class="mini">▶</span>
    </button>`).join("");
  document.querySelectorAll(".clip-item").forEach(button => button.addEventListener("click", () => selectClip(Number(button.dataset.index))));
}

video.addEventListener("canplay", () => { $("loading").classList.add("hidden"); $("errorBox").classList.add("hidden"); updateUI(); });
video.addEventListener("error", showError);
video.addEventListener("play", updateUI);
video.addEventListener("pause", updateUI);
progress.addEventListener("input", () => { video.currentTime = clip().start + Number(progress.value) * (clip().end - clip().start); updateUI(); });
$("play").addEventListener("click", togglePlay); $("centerPlay").addEventListener("click", togglePlay);
$("restart").addEventListener("click", () => play(true));
$("prevClip").addEventListener("click", () => selectClip(index - 1)); $("nextClip").addEventListener("click", () => selectClip(index + 1));
$("prevFrame").addEventListener("click", () => stepFrame(-1)); $("nextFrame").addEventListener("click", () => stepFrame(1));
$("speed").addEventListener("click", () => { speed = speeds[(speeds.indexOf(speed)+1)%speeds.length]; video.playbackRate = speed; $("speed").textContent = `速度 ${speed}×`; });
$("loop").addEventListener("click", () => { loop = !loop; $("loop").classList.toggle("on", loop); $("loop").textContent = loop ? "循环开" : "循环关"; });
$("sound").addEventListener("click", () => { video.muted = !video.muted; $("sound").textContent = video.muted ? "🔇" : "🔊"; });
$("fullscreen").addEventListener("click", () => document.fullscreenElement ? document.exitFullscreen() : $("videoStage").requestFullscreen());
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") { event.preventDefault(); togglePlay(); }
  if (event.code === "ArrowLeft") stepFrame(-1);
  if (event.code === "ArrowRight") stepFrame(1);
});

renderList(); video.currentTime = clips[0].start; updateUI();
