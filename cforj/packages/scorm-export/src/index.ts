import JSZip from 'jszip'
import type { CourseApp } from '@course-studio/player'
import { generateImsmanifest } from './imsmanifest'

export interface ScormExportOptions {
  scormVersion?: '1.2' | '2004'
}

export async function exportScorm(
  app: CourseApp,
  options: ScormExportOptions = {}
): Promise<Blob> {
  const { scormVersion = '1.2' } = options
  const zip = new JSZip()

  zip.file('imsmanifest.xml', generateImsmanifest(app, scormVersion))
  zip.file('course.json', JSON.stringify(app, null, 2))
  zip.file('index.html', generateScormHtml(app, scormVersion))

  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip' })
}

function generateScormHtml(app: CourseApp, scormVersion: '1.2' | '2004'): string {
  const courseJson = JSON.stringify(app)

  // SCORM API call helpers — differ between 1.2 and 2004
  const scormInit = scormVersion === '1.2'
    ? `var API = window.API || parent.API; if(API) API.LMSInitialize('');`
    : `var API = window.API_1484_11 || parent.API_1484_11; if(API) API.Initialize('');`

  const scormFinish = scormVersion === '1.2'
    ? `if(API){API.LMSSetValue('cmi.core.lesson_status','passed');API.LMSSetValue('cmi.core.score.raw',String(state.score));API.LMSFinish('');}`
    : `if(API){API.SetValue('cmi.completion_status','completed');API.SetValue('cmi.success_status','passed');API.SetValue('cmi.score.raw',String(state.score));API.Terminate('');}`

  return `<!DOCTYPE html>
<html lang="${escapeHtml(app.language ?? 'en')}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(app.title)}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f9fa;color:#111;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:24px}
    .player{background:#fff;border-radius:16px;box-shadow:0 4px 32px rgba(0,0,0,.08);width:100%;max-width:720px;overflow:hidden}
    .player-header{display:flex;justify-content:space-between;align-items:center;padding:20px 28px;background:#5B5FED;color:#fff}
    .player-title{font-size:18px;font-weight:700}
    .player-progress{font-size:13px;opacity:.85}
    .player-screen{padding:28px}
    .player-screen-title{font-size:16px;font-weight:600;color:#333;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #f0f0f0}
    .component{margin-bottom:20px}.component:last-child{margin-bottom:0}
    .c-text{font-size:15px;line-height:1.7;color:#333}
    .c-text h1,.c-text h2,.c-text h3{margin-bottom:8px;margin-top:16px}
    .c-text ul,.c-text ol{padding-left:20px;margin-bottom:8px}
    .c-image img{max-width:100%;border-radius:8px;display:block;margin:0 auto}
    .c-image figcaption{font-size:12px;color:#999;margin-top:6px;text-align:center}
    .c-video video,.c-video iframe{width:100%;border-radius:8px;aspect-ratio:16/9;display:block;border:none}
    .c-button button{padding:10px 24px;border-radius:8px;border:none;cursor:pointer;font-size:14px;font-weight:600;background:#5B5FED;color:#fff}
    .c-quiz-question{font-size:15px;font-weight:600;margin-bottom:14px}
    .c-quiz-options{display:flex;flex-direction:column;gap:8px}
    .c-quiz-option{padding:10px 14px;border:1.5px solid #e5e5e5;border-radius:8px;cursor:pointer;font-size:14px;transition:all .15s;background:#fff;width:100%;text-align:left}
    .c-quiz-option:hover:not([disabled]){border-color:#5B5FED;background:#f5f5ff}
    .c-quiz-option.correct{border-color:#10b981;background:#f0fdf4;color:#065f46}
    .c-quiz-option.incorrect{border-color:#ef4444;background:#fef2f2;color:#991b1b}
    .c-quiz-feedback{margin-top:10px;font-size:13px;padding:8px 12px;border-radius:6px}
    .c-quiz-feedback.correct{background:#f0fdf4;color:#065f46}
    .c-quiz-feedback.incorrect{background:#fef2f2;color:#991b1b}
    .c-tf-statement{font-size:15px;font-weight:500;margin-bottom:14px}
    .c-tf-buttons{display:flex;gap:10px}
    .c-tf-btn{flex:1;padding:10px;border-radius:8px;border:1.5px solid #e5e5e5;cursor:pointer;font-size:14px;font-weight:600;background:#fff;transition:all .15s}
    .c-tf-btn:hover:not([disabled]){border-color:#5B5FED}
    .c-tf-btn.correct{border-color:#10b981;background:#f0fdf4;color:#065f46}
    .c-tf-btn.incorrect{border-color:#ef4444;background:#fef2f2;color:#991b1b}
    .c-flash-card{border:1.5px solid #e5e5e5;border-radius:12px;padding:32px;text-align:center;cursor:pointer;min-height:120px;display:flex;align-items:center;justify-content:center;font-size:16px;transition:all .2s;background:#fff}
    .c-flash-card:hover{border-color:#5B5FED}
    .c-flash-nav{display:flex;justify-content:center;align-items:center;gap:12px;margin-top:12px;font-size:13px;color:#999}
    .c-flash-nav button{background:none;border:none;cursor:pointer;font-size:18px;color:#666;padding:2px 8px}
    .player-footer{padding:16px 28px;border-top:1px solid #f0f0f0;display:flex;gap:10px;justify-content:flex-end;background:#fafafa}
    .btn-primary{padding:10px 24px;background:#5B5FED;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600}
    .btn-primary:hover{background:#4346c4}
    .btn-secondary{padding:10px 24px;background:#f0f0f0;color:#333;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600}
    .player-complete{padding:48px 28px;text-align:center}
    .player-complete h2{font-size:24px;font-weight:700;margin-bottom:8px;color:#10b981}
    .player-complete p{color:#666;font-size:15px}
    .branding{text-align:center;font-size:11px;color:#ccc;margin-top:16px}
    .branding a{color:#ccc;text-decoration:none}.branding a:hover{color:#34d399}
  </style>
</head>
<body>
<div class="player" id="player"></div>
<div class="branding">Built with <a href="https://cforj.studio" target="_blank">cforj</a></div>
<script>
try{
var COURSE=${courseJson};
if(!COURSE||!COURSE.screens||COURSE.screens.length===0){document.getElementById('player').innerHTML='<div style="padding:40px;text-align:center;color:#999">No course data found</div>';throw new Error('Invalid course data');}
var state={screenIndex:0,score:0,quizAnswers:{},quizMultiSelected:{},quizMultiCorrect:{},flashIndex:{},flashSide:{},completed:false};

// SCORM API init (wrapped in try/catch so it doesn't break standalone viewing)
try{${scormInit}}catch(scormErr){console.log('SCORM API not available (standalone mode)');}
var scormFinishCode=function(){try{${scormFinish}}catch(e){}};

function escH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

function renderComponent(c){
  if(!c||c.hidden)return'';
  if(c.type==='text')return'<div class="component c-text">'+c.content+'</div>';
  if(c.type==='image')return'<figure class="component c-image"><img src="'+escH(c.src||'')+'" alt="'+escH(c.alt||'')+'"></figure>';
  if(c.type==='video'){var s=c.src||'';if(s.includes('youtube')||s.includes('youtu.be')){var v=s.replace('watch?v=','embed/').replace('youtu.be/','youtube.com/embed/');return'<div class="component c-video"><iframe src="'+escH(v)+'" allowfullscreen></iframe></div>';}return'<div class="component c-video"><video src="'+escH(s)+'" controls></video></div>';}
  if(c.type==='button')return'<div class="component c-button"><button onclick="handleBtn(\\''+c.id+'\\')">'+escH(c.label||'Button')+'</button></div>';
  if(c.type==='quiz-single'){var ans=state.quizAnswers[c.id];var opts=(c.options||[]).map(function(o,i){var cl=ans!==undefined?(i===c.correct?'correct':(i===ans?'incorrect':'')):'';return'<button class="c-quiz-option '+cl+'" '+(ans!==undefined?'disabled':'')+' onclick="qSingle(\\''+c.id+'\\','+i+','+c.correct+')">'+escH(o)+'</button>';}).join('');var fb=ans!==undefined?'<div class="c-quiz-feedback '+(ans===true?'correct':'incorrect')+'">'+(ans?'Correct! ✓':'Incorrect ✗')+'</div>':'';return'<div class="component"><div class="c-quiz-question">'+escH(c.question||'')+'</div><div class="c-quiz-options">'+opts+'</div>'+fb+'</div>';}
  if(c.type==='quiz-multi'){var chk=state.quizAnswers[c.id];var pnd=state.quizMultiSelected[c.id]||[];var opts=(c.options||[]).map(function(o,i){var isC=(c.correct||[]).indexOf(i)!==-1;var cl=chk?(isC?'correct':(chk.indexOf(i)!==-1?'incorrect':'')):(pnd.indexOf(i)!==-1?'selected':'');return'<button class="c-quiz-option '+cl+'" '+(chk?'disabled':'')+' onclick="qMultiToggle(\\''+c.id+'\\','+i+')">'+escH(o)+'</button>';}).join('');var cArr='['+((c.correct||[]).join(','))+']';var fb=chk?'<div class="c-quiz-feedback '+(state.quizMultiCorrect[c.id]?'correct':'incorrect')+'">'+(state.quizMultiCorrect[c.id]?'Correct! ✓':'Incorrect ✗')+'</div>':'<div style="margin-top:8px"><button class="btn-primary" style="font-size:12px;padding:6px 16px" onclick="qMultiCheck(\\''+c.id+'\\','+cArr+')">Submit</button></div>';return'<div class="component"><div class="c-quiz-question">'+escH(c.question||'')+'</div><div class="c-quiz-options">'+opts+'</div>'+fb+'</div>';}
  if(c.type==='true-false'){var ans=state.quizAnswers[c.id];var tc=ans!==undefined&&c.correct===true?'correct':(ans!==undefined?'incorrect':'');var fc=ans!==undefined&&c.correct===false?'correct':(ans!==undefined?'incorrect':'');return'<div class="component"><div class="c-tf-statement">'+escH(c.statement||'')+'</div><div class="c-tf-buttons"><button class="c-tf-btn '+tc+'" '+(ans!==undefined?'disabled':'')+' onclick="qTF(\\''+c.id+'\\',true)">True</button><button class="c-tf-btn '+fc+'" '+(ans!==undefined?'disabled':'')+' onclick="qTF(\\''+c.id+'\\',false)">False</button></div>'+(ans!==undefined?'<div class="c-quiz-feedback '+(state.quizAnswers[c.id]?'correct':'incorrect')+'">'+(state.quizAnswers[c.id]?'Correct! ✓':'Incorrect ✗')+'</div>':'')+'</div>';}
  if(c.type==='flashcards'){var idx=state.flashIndex[c.id]||0;var side=state.flashSide[c.id]||'front';var card=(c.cards||[])[idx]||{front:'',back:''};return'<div class="component"><div class="c-flash-card" onclick="flipFlash(\\''+c.id+'\\')"><span>'+(side==='front'?escH(card.front):escH(card.back))+'</span></div><div class="c-flash-nav"><button onclick="prevFlash(\\''+c.id+'\\','+((c.cards||[]).length)+')">←</button><span>'+(idx+1)+'/'+((c.cards||[]).length)+'</span><button onclick="nextFlash(\\''+c.id+'\\','+((c.cards||[]).length)+')">→</button></div></div>';}
  if(c.type==='branching'){var choices=(c.choices||[]).map(function(ch){return'<button class="c-quiz-option" style="text-align:left" onclick="handleBranch()">'+escH(ch.label||'')+'</button>';}).join('');return'<div class="component"><div class="c-quiz-question">'+escH(c.scenario||'')+'</div><div class="c-quiz-options">'+choices+'</div></div>';}
  return'';
}

function render(){
  var p=document.getElementById('player');
  if(state.completed){p.innerHTML='<div class="player-complete"><h2>✓ Complete!</h2>'+(COURSE.settings&&COURSE.settings.showResults?'<p>Score: '+state.score+' / '+Object.keys(state.quizAnswers).length+'</p>':'')+'</div>';return;}
  var screen=COURSE.screens[state.screenIndex];if(!screen){p.innerHTML='';return;}
  var comps=(screen.components||[]).map(renderComponent).join('');
  var isFirst=state.screenIndex===0,isLast=state.screenIndex===COURSE.screens.length-1;
  p.innerHTML='<div class="player-header"><div class="player-title">'+escH(COURSE.title)+'</div><div class="player-progress">'+(state.screenIndex+1)+' / '+COURSE.screens.length+'</div></div><div class="player-screen"><h2 class="player-screen-title">'+escH(screen.title)+'</h2>'+comps+'</div><div class="player-footer">'+(!isFirst?'<button class="btn-secondary" onclick="prev()">Back</button>':'')+'<button class="btn-primary" onclick="next()">'+(isLast?'Finish':'Next')+'</button></div>';
}
function next(){if(state.screenIndex<COURSE.screens.length-1){state.screenIndex++;render();}else{state.completed=true;scormFinishCode();render();}}
function prev(){if(state.screenIndex>0){state.screenIndex--;render();}}
function qSingle(id,chosen,correct){if(state.quizAnswers[id]!==undefined)return;state.quizAnswers[id]=chosen===correct;if(chosen===correct)state.score++;render();}
function qMultiToggle(id,idx){if(state.quizAnswers[id])return;var sel=state.quizMultiSelected[id]=state.quizMultiSelected[id]||[];var pos=sel.indexOf(idx);if(pos===-1)sel.push(idx);else sel.splice(pos,1);render();}
function qMultiCheck(id,correct){var sel=(state.quizMultiSelected[id]||[]).slice().sort(function(a,b){return a-b;});var exp=correct.slice().sort(function(a,b){return a-b;});var ok=sel.length===exp.length&&sel.every(function(v,i){return v===exp[i];});state.quizAnswers[id]=sel;state.quizMultiCorrect[id]=ok;if(ok)state.score++;render();}
function qTF(id,val){if(state.quizAnswers[id]!==undefined)return;var sc=COURSE.screens[state.screenIndex];var c=sc&&sc.components&&sc.components.find(function(x){return x.id===id;});if(!c)return;state.quizAnswers[id]=val===c.correct;if(state.quizAnswers[id])state.score++;render();}
function flipFlash(id){state.flashSide[id]=state.flashSide[id]==='back'?'front':'back';render();}
function nextFlash(id,len){state.flashIndex[id]=((state.flashIndex[id]||0)+1)%len;state.flashSide[id]='front';render();}
function prevFlash(id,len){state.flashIndex[id]=((state.flashIndex[id]||0)+len-1)%len;state.flashSide[id]='front';render();}
function handleBtn(){}
function handleBranch(){}
render();
}catch(e){console.error('SCORM player error:',e);document.getElementById('player').innerHTML='<div style="padding:40px;text-align:center"><h2 style="color:#ef4444;margin-bottom:8px">Error loading course</h2><p style="color:#999;font-size:14px">'+e.message+'</p></div>';}
</script>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export { generateImsmanifest } from './imsmanifest'
export { generateTinCanXml, generateXApiIndexHtml } from './xapi'
export type { CourseApp } from '@course-studio/player'

/** Standalone HTML export — single self-contained file */
export async function exportHtml(app: CourseApp): Promise<Blob> {
  const html = generateStandaloneHtml(app)
  return new Blob([html], { type: 'text/html;charset=utf-8' })
}

function generateStandaloneHtml(app: CourseApp): string {
  const courseJson = JSON.stringify(app)

  return `<!DOCTYPE html>
<html lang="${escapeHtml(app.language ?? 'en')}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(app.title)}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f9fa;color:#111;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:24px}
    .player{background:#fff;border-radius:16px;box-shadow:0 4px 32px rgba(0,0,0,.08);width:100%;max-width:720px;overflow:hidden}
    .player-header{display:flex;justify-content:space-between;align-items:center;padding:20px 28px;background:#5B5FED;color:#fff}
    .player-title{font-size:18px;font-weight:700}
    .player-progress{font-size:13px;opacity:.85}
    .player-screen{padding:28px}
    .player-screen-title{font-size:16px;font-weight:600;color:#333;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #f0f0f0}
    .component{margin-bottom:20px}.component:last-child{margin-bottom:0}
    .c-text{font-size:15px;line-height:1.7;color:#333}
    .c-text h1,.c-text h2,.c-text h3{margin-bottom:8px;margin-top:16px}
    .c-text ul,.c-text ol{padding-left:20px;margin-bottom:8px}
    .c-image img{max-width:100%;border-radius:8px;display:block;margin:0 auto}
    .c-image figcaption{font-size:12px;color:#999;margin-top:6px;text-align:center}
    .c-video video,.c-video iframe{width:100%;border-radius:8px;aspect-ratio:16/9;display:block;border:none}
    .c-button button{padding:10px 24px;border-radius:8px;border:none;cursor:pointer;font-size:14px;font-weight:600;background:#5B5FED;color:#fff}
    .c-quiz-question{font-size:15px;font-weight:600;margin-bottom:14px}
    .c-quiz-options{display:flex;flex-direction:column;gap:8px}
    .c-quiz-option{padding:10px 14px;border:1.5px solid #e5e5e5;border-radius:8px;cursor:pointer;font-size:14px;background:#fff;width:100%;text-align:left;transition:all .15s}
    .c-quiz-option:hover:not([disabled]){border-color:#5B5FED;background:#f5f5ff}
    .c-quiz-option.correct{border-color:#10b981;background:#f0fdf4;color:#065f46}
    .c-quiz-option.incorrect{border-color:#ef4444;background:#fef2f2;color:#991b1b}
    .c-quiz-feedback{margin-top:10px;font-size:13px;padding:8px 12px;border-radius:6px}
    .c-quiz-feedback.correct{background:#f0fdf4;color:#065f46}
    .c-quiz-feedback.incorrect{background:#fef2f2;color:#991b1b}
    .c-tf-statement{font-size:15px;font-weight:500;margin-bottom:14px}
    .c-tf-buttons{display:flex;gap:10px}
    .c-tf-btn{flex:1;padding:10px;border-radius:8px;border:1.5px solid #e5e5e5;cursor:pointer;font-size:14px;font-weight:600;background:#fff;transition:all .15s}
    .c-tf-btn:hover:not([disabled]){border-color:#5B5FED}
    .c-tf-btn.correct{border-color:#10b981;background:#f0fdf4;color:#065f46}
    .c-tf-btn.incorrect{border-color:#ef4444;background:#fef2f2;color:#991b1b}
    .c-flash-card{border:1.5px solid #e5e5e5;border-radius:12px;padding:32px;text-align:center;cursor:pointer;min-height:120px;display:flex;align-items:center;justify-content:center;font-size:16px;transition:all .2s;background:#fff}
    .c-flash-card:hover{border-color:#5B5FED}
    .c-flash-nav{display:flex;justify-content:center;align-items:center;gap:12px;margin-top:12px;font-size:13px;color:#999}
    .c-flash-nav button{background:none;border:none;cursor:pointer;font-size:18px;color:#666;padding:2px 8px}
    .player-footer{padding:16px 28px;border-top:1px solid #f0f0f0;display:flex;gap:10px;justify-content:flex-end;background:#fafafa}
    .btn-primary{padding:10px 24px;background:#5B5FED;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600}
    .btn-primary:hover{background:#4346c4}
    .btn-secondary{padding:10px 24px;background:#f0f0f0;color:#333;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600}
    .player-complete{padding:48px 28px;text-align:center}
    .player-complete h2{font-size:24px;font-weight:700;margin-bottom:8px;color:#10b981}
    .player-complete p{color:#666;font-size:15px}
    .branding{text-align:center;font-size:11px;color:#ccc;margin-top:16px}
    .branding a{color:#ccc;text-decoration:none}.branding a:hover{color:#34d399}
  </style>
</head>
<body>
<div class="player" id="player"></div>
<div class="branding">Built with <a href="https://cforj.studio" target="_blank">cforj</a></div>
<script>
try{
var COURSE=${courseJson};
if(!COURSE||!COURSE.screens||COURSE.screens.length===0){document.getElementById('player').innerHTML='<div style="padding:40px;text-align:center;color:#999">No course data found</div>';throw new Error('Invalid course data');}
var state={screenIndex:0,score:0,quizAnswers:{},quizMultiSelected:{},quizMultiCorrect:{},flashIndex:{},flashSide:{},completed:false};
function escH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function renderComponent(c){
  if(!c||c.hidden)return'';
  if(c.type==='text')return'<div class="component c-text">'+c.content+'</div>';
  if(c.type==='image')return'<figure class="component c-image"><img src="'+escH(c.src||'')+'" alt="'+escH(c.alt||'')+'"></figure>';
  if(c.type==='video'){var s=c.src||'';if(s.includes('youtube')||s.includes('youtu.be')){var v=s.replace('watch?v=','embed/').replace('youtu.be/','youtube.com/embed/');return'<div class="component c-video"><iframe src="'+escH(v)+'" allowfullscreen></iframe></div>';}return'<div class="component c-video"><video src="'+escH(s)+'" controls></video></div>';}
  if(c.type==='button')return'<div class="component c-button"><button onclick="handleBtn(\\''+c.id+'\\')">'+escH(c.label||'Button')+'</button></div>';
  if(c.type==='quiz-single'){var ans=state.quizAnswers[c.id];var opts=(c.options||[]).map(function(o,i){var cl=ans!==undefined?(i===c.correct?'correct':(i===ans?'incorrect':'')):'';return'<button class="c-quiz-option '+cl+'" '+(ans!==undefined?'disabled':'')+' onclick="qSingle(\\''+c.id+'\\','+i+','+c.correct+')">'+escH(o)+'</button>';}).join('');var fb=ans!==undefined?'<div class="c-quiz-feedback '+(ans===true?'correct':'incorrect')+'">'+(ans?'Correct! ✓':'Incorrect ✗')+'</div>':'';return'<div class="component"><div class="c-quiz-question">'+escH(c.question||'')+'</div><div class="c-quiz-options">'+opts+'</div>'+fb+'</div>';}
  if(c.type==='true-false'){var ans=state.quizAnswers[c.id];var tc=ans!==undefined&&c.correct===true?'correct':(ans!==undefined?'incorrect':'');var fc=ans!==undefined&&c.correct===false?'correct':(ans!==undefined?'incorrect':'');return'<div class="component"><div class="c-tf-statement">'+escH(c.statement||'')+'</div><div class="c-tf-buttons"><button class="c-tf-btn '+tc+'" '+(ans!==undefined?'disabled':'')+' onclick="qTF(\\''+c.id+'\\',true)">True</button><button class="c-tf-btn '+fc+'" '+(ans!==undefined?'disabled':'')+' onclick="qTF(\\''+c.id+'\\',false)">False</button></div>'+(ans!==undefined?'<div class="c-quiz-feedback '+(state.quizAnswers[c.id]?'correct':'incorrect')+'">'+(state.quizAnswers[c.id]?'Correct! ✓':'Incorrect ✗')+'</div>':'')+'</div>';}
  if(c.type==='flashcards'){var idx=state.flashIndex[c.id]||0;var side=state.flashSide[c.id]||'front';var card=(c.cards||[])[idx]||{front:'',back:''};return'<div class="component"><div class="c-flash-card" onclick="flipFlash(\\''+c.id+'\\')"><span>'+(side==='front'?escH(card.front):escH(card.back))+'</span></div><div class="c-flash-nav"><button onclick="prevFlash(\\''+c.id+'\\','+((c.cards||[]).length)+')">←</button><span>'+(idx+1)+'/'+((c.cards||[]).length)+'</span><button onclick="nextFlash(\\''+c.id+'\\','+((c.cards||[]).length)+')">→</button></div></div>';}
  if(c.type==='branching'){var choices=(c.choices||[]).map(function(ch){return'<button class="c-quiz-option" style="text-align:left" onclick="handleBranch()">'+escH(ch.label||'')+'</button>';}).join('');return'<div class="component"><div class="c-quiz-question">'+escH(c.scenario||'')+'</div><div class="c-quiz-options">'+choices+'</div></div>';}
  return'';
}
function render(){
  var p=document.getElementById('player');
  if(state.completed){p.innerHTML='<div class="player-complete"><h2>✓ Complete!</h2>'+(COURSE.settings&&COURSE.settings.showResults?'<p>Score: '+state.score+' / '+Object.keys(state.quizAnswers).length+'</p>':'')+'</div>';return;}
  var screen=COURSE.screens[state.screenIndex];if(!screen){p.innerHTML='';return;}
  var comps=(screen.components||[]).map(renderComponent).join('');
  var isFirst=state.screenIndex===0,isLast=state.screenIndex===COURSE.screens.length-1;
  p.innerHTML='<div class="player-header"><div class="player-title">'+escH(COURSE.title)+'</div><div class="player-progress">'+(state.screenIndex+1)+' / '+COURSE.screens.length+'</div></div><div class="player-screen"><h2 class="player-screen-title">'+escH(screen.title)+'</h2>'+comps+'</div><div class="player-footer">'+(!isFirst?'<button class="btn-secondary" onclick="prev()">Back</button>':'')+'<button class="btn-primary" onclick="next()">'+(isLast?'Finish':'Next')+'</button></div>';
}
function next(){if(state.screenIndex<COURSE.screens.length-1){state.screenIndex++;render();}else{state.completed=true;render();}}
function prev(){if(state.screenIndex>0){state.screenIndex--;render();}}
function qSingle(id,chosen,correct){if(state.quizAnswers[id]!==undefined)return;state.quizAnswers[id]=chosen===correct;if(chosen===correct)state.score++;render();}
function qMultiToggle(id,idx){if(state.quizAnswers[id])return;var sel=state.quizMultiSelected[id]=state.quizMultiSelected[id]||[];var pos=sel.indexOf(idx);if(pos===-1)sel.push(idx);else sel.splice(pos,1);render();}
function qMultiCheck(id,correct){var sel=(state.quizMultiSelected[id]||[]).slice().sort(function(a,b){return a-b;});var exp=correct.slice().sort(function(a,b){return a-b;});var ok=sel.length===exp.length&&sel.every(function(v,i){return v===exp[i];});state.quizAnswers[id]=sel;state.quizMultiCorrect[id]=ok;if(ok)state.score++;render();}
function qTF(id,val){if(state.quizAnswers[id]!==undefined)return;var sc=COURSE.screens[state.screenIndex];var c=sc&&sc.components&&sc.components.find(function(x){return x.id===id;});if(!c)return;state.quizAnswers[id]=val===c.correct;if(state.quizAnswers[id])state.score++;render();}
function flipFlash(id){state.flashSide[id]=state.flashSide[id]==='back'?'front':'back';render();}
function nextFlash(id,len){state.flashIndex[id]=((state.flashIndex[id]||0)+1)%len;state.flashSide[id]='front';render();}
function prevFlash(id,len){state.flashIndex[id]=((state.flashIndex[id]||0)+len-1)%len;state.flashSide[id]='front';render();}
function handleBtn(){}
function handleBranch(){}
render();
}catch(e){console.error('Player error:',e);document.getElementById('player').innerHTML='<div style="padding:40px;text-align:center"><h2 style="color:#ef4444;margin-bottom:8px">Error loading course</h2><p style="color:#999;font-size:14px">'+e.message+'</p></div>';}
</script>
</body>
</html>`
}
