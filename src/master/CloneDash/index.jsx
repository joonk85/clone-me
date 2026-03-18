import { useEffect, useRef, useState } from "react";

import Av from "../../common/Av";
import Bt from "../../common/Bt";
import Cd from "../../common/Cd";
import Pb from "../../common/Pb";
import Sw from "../../common/Sw";
import Tg from "../../common/Tg";
import { ANALYTICS, CONV_HISTORY, FEEDBACKS, REPORT_DATA, VER_FILES } from "../../lib/mockData";
import { buildCloneTestScenarios } from "../cloneTestScenarios";
import { getSupabaseBrowserClient } from "../../lib/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * 마스터 클론 대시보드 — 탭: 개요 / 클론 관리 / 인사이트 / 운영.
 * 학습 파일·재학습, 고정 Q&A, 구독자 테스트 채팅, 월별 리포트·후기·공지·마켓 링크.
 * 하위 Overview·CloneManage 등은 추출 예정, 현재 로직 전부 이 파일 인라인.
 */
export default function CloneDash({ clone, setClone, onBack, setView }) {
  const [tab,setTab]=useState("overview");
  const TABS=[["overview","개요"],["clone","클론 관리"],["insight","인사이트"],["ops","운영"]];
  const [replyOpen,setReplyOpen]=useState(null);
  const [showAdvanced,setShowAdvanced]=useState(false);
  // Test clone
  const [testOpen,setTestOpen]=useState(false);
  const [testMsgs,setTestMsgs]=useState([]);
  const [testInp,setTestInp]=useState("");
  const [testLoad,setTestLoad]=useState(false);
  const [testConvId,setTestConvId]=useState(null);
  const [scenarioMarks,setScenarioMarks]=useState({});
  const [scenarioPanelOpen,setScenarioPanelOpen]=useState(true);
  const [fileRefRows,setFileRefRows]=useState(null);
  const [fileRefLoading,setFileRefLoading]=useState(false);
  const [fileRefErr,setFileRefErr]=useState(null);
  const [refPeriodFilter,setRefPeriodFilter]=useState("all");
  const [fileRefTick,setFileRefTick]=useState(0);
  const testRef=useRef(null);
  const testScenarios = buildCloneTestScenarios({ ...clone, tags: clone.tags || [] });
  // Fixed answers
  const [fixedQA,setFixedQA]=useState([
    {id:"fq1",q:"이 클론이 뭘 잘 알아요?",a:"저는 B2B 영업 전략, 콜드아웃리치, 협상, 엔터프라이즈 영업을 전문으로 합니다. 15년간 현장에서 쌓은 실전 지식을 기반으로 답변드립니다."},
    {id:"fq2",q:"AI 아닌가요?",a:"맞아요, 저는 김민준의 AI 클론입니다. 실제 강사님의 강의 자료와 노하우를 학습했습니다. 제 답변의 한계를 느끼시면 실제 강사님과 1:1 상담을 연결해드릴 수 있습니다."},
  ]);
  const [newFQ,setNewFQ]=useState({q:"",a:""});
  const [fqOpen,setFqOpen]=useState(null);
  const [replyText,setReplyText]=useState("");
  const [newNotice,setNewNotice]=useState({title:"",body:"",type:"일반"});
  const [newMkt,setNewMkt]=useState({topic:"",product:"",url:"",price:""});
  const [training,setTraining]=useState(clone.trainingStatus||"idle");
  const [deleteConfirm,setDeleteConfirm]=useState(null);
  const [dupWarning,setDupWarning]=useState(null);
  const [expandedConv,setExpandedConv]=useState(null);
  const [expandedVer,setExpandedVer]=useState(null);
  const now2=new Date();
  const [rYear,setRYear]=useState(now2.getFullYear());
  const [rMonth,setRMonth]=useState(now2.getMonth()+1);
  const NOTICE_TYPES=["일반","📌 중요","🎉 이벤트","📚 자료 업데이트","⚠️ 주의사항"];
  const FTYPE_C={PDF:"var(--rd)",DOCX:"var(--cy)",TXT:"var(--gn)",SRT:"var(--am)",NOTION:"var(--pu)",VIDEO:"#ff8c42"};
  const matFileRef=useRef(null);
  const CAT_COLORS={PDF:"var(--rd)","DOCX":"var(--cy)","TXT":"var(--gn)","SRT":"var(--am)"};

  const triggerTraining=(action,fileName)=>{
    setTraining("training");
    updateClone(()=>({trainingStatus:"training"}));
    setTimeout(()=>{
      const newV="v"+(parseInt((clone.v||"v1").replace("v",""))+1);
      updateClone(p=>({
        trainingStatus:"idle",
        v:newV,
        docs:(p.files||[]).length,
      }));
      setTraining("idle");
    },3000);
  };

  const handleAddFiles=(newFiles)=>{
    const existing=(clone.files||[]);
    const dups=[];
    const toAdd=[];
    newFiles.forEach(f=>{
      const isDup=existing.some(e=>e.name===f.name);
      if(isDup)dups.push(f.name);
      else toAdd.push(f);
    });
    if(dups.length>0){setDupWarning(dups);}
    if(toAdd.length>0){
      setTraining("uploading");
      setTimeout(()=>{
        const added=toAdd.map((f,i)=>({
          id:"nf"+Date.now()+i,name:f.name,
          size:(f.size/1024/1024).toFixed(1)+" MB",
          type:f.name.split(".").pop().toUpperCase(),
          cat:"기타",
          addedAt:new Date().toLocaleDateString("ko"),
          ver:clone.v||"v1",
          words:Math.floor(Math.random()*8000+2000),
        }));
        updateClone(p=>({files:[...(p.files||[]),...added]}));
        setTraining("idle");
        triggerTraining("upload");
      },1200);
    }
  };

  const handleDeleteFile=(fileId,fileName)=>{
    if(deleteConfirm===fileId){
      updateClone(p=>({files:(p.files||[]).filter(f=>f.id!==fileId)}));
      setDeleteConfirm(null);
      triggerTraining("delete");
    } else {
      setDeleteConfirm(fileId);
    }
  };

  const updateClone=(fn)=>setClone(prev=>({...prev,...fn(prev)}));

  useEffect(()=>{
    if(tab!=="insight"||!UUID_RE.test(String(clone.id||""))){
      return;
    }
    let cancelled=false;
    (async()=>{
      setFileRefLoading(true);
      setFileRefErr(null);
      try{
        const sb=getSupabaseBrowserClient();
        const {data:rows,error}=await sb.from("file_reference_stats")
          .select("file_id,period,reference_count,updated_at")
          .eq("clone_id",clone.id)
          .order("reference_count",{ascending:false});
        if(cancelled)return;
        if(error)throw error;
        const list=rows||[];
        const fids=[...new Set(list.map(r=>r.file_id).filter(Boolean))];
        let fileMap={};
        if(fids.length){
          const {data:files,error:fe}=await sb.from("clone_files").select("id,name,type").in("id",fids);
          if(!fe&&files)for(const f of files)fileMap[f.id]=f;
        }
        if(cancelled)return;
        setFileRefRows(list.map(r=>({...r,clone_files:r.file_id?fileMap[r.file_id]??null:null})));
      }catch(e){
        if(!cancelled)setFileRefErr(e?.message||"불러오기 실패");
        if(!cancelled)setFileRefRows([]);
      }finally{
        if(!cancelled)setFileRefLoading(false);
      }
    })();
    return()=>{cancelled=true;};
  },[tab,clone.id,fileRefTick]);

  const fileRefCurMonth=new Date().toISOString().slice(0,7);
  const fileRefPeriods=[...new Set([fileRefCurMonth,...(fileRefRows||[]).map(r=>r.period)])].sort().reverse();
  const fileRefDisplay=(()=>{
    const rows=fileRefRows||[];
    if(refPeriodFilter==="all"){
      const m=new Map();
      for(const r of rows){
        const fid=r.file_id;
        const cf=r.clone_files;
        const name=cf?.name||"(파일)";
        const type=cf?.type||"";
        const cur=m.get(fid)||{file_id:fid,name,type,count:0};
        cur.count+=(r.reference_count||0);
        m.set(fid,cur);
      }
      return[...m.values()].sort((a,b)=>b.count-a.count);
    }
    return rows
      .filter(r=>r.period===refPeriodFilter)
      .map(r=>({
        file_id:r.file_id,
        name:r.clone_files?.name||"(파일)",
        type:r.clone_files?.type||"",
        count:r.reference_count||0,
        updated_at:r.updated_at,
      }))
      .sort((a,b)=>b.count-a.count);
  })();

  const testSend=async(maybePreset)=>{
    const preset=typeof maybePreset==="string"?maybePreset:null;
    const m=(preset!=null?preset:testInp).trim();
    if(!m||testLoad)return;
    if(preset==null)setTestInp("");
    const prior=testMsgs.filter(x=>x.r==="u"||x.r==="a");
    const apiMsgs=[...prior.map(x=>({role:x.r==="u"?"user":"assistant",content:x.t})),{role:"user",content:m}];
    setTestMsgs(p=>[...p,{r:"u",t:m}]);
    setTestLoad(true);
    const isUuid=UUID_RE.test(String(clone.id||""));
    let sb; try{sb=getSupabaseBrowserClient();}catch{sb=null;}
    let token=null;
    if(sb){const {data}=await sb.auth.getSession();token=data?.session?.access_token;}
    if(isUuid&&token){
      try{
        const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
          body:JSON.stringify({cloneId:clone.id,conversationId:testConvId,messages:apiMsgs})});
        const d=await res.json();
        if(d.conversationId)setTestConvId(d.conversationId);
        if(!res.ok){setTestMsgs(p=>[...p,{r:"a",t:d.error||"요청 실패",src:"오류"}]);}
        else{setTestMsgs(p=>[...p,{r:"a",t:d.answer||"",src:d.fromFixedAnswer?"고정 답변":d.usedRag?"RAG+Claude":"Claude",sources:d.sources||[]}]);}
      }catch{setTestMsgs(p=>[...p,{r:"a",t:"연결 오류입니다.",src:""}]);}
    }else{
      const fixed=fixedQA.find(f=>m.includes(f.q.slice(0,Math.min(12,f.q.length))));
      if(fixed){setTimeout(()=>{setTestMsgs(p=>[...p,{r:"a",t:fixed.a,src:"고정 답변(로컬)"}]);setTestLoad(false);},450);return;}
      setTestMsgs(p=>[...p,{r:"a",t:isUuid?"로그인하면 실제 RAG·고정답변과 동일하게 테스트됩니다.":"Supabase에 저장된 클론(대시보드에서 생성)에서 테스트해 주세요.",src:"안내"}]);
    }
    setTestLoad(false);
  };

  return(
    <div style={{minHeight:600,padding:"16px 18px 48px"}}>
      <div style={{maxWidth:820,margin:"0 auto"}}>
        {/* Back + Clone header */}
        <button type="button" onClick={onBack} style={{background:"none",border:"none",color:"var(--tx2)",cursor:"pointer",fontSize:12,marginBottom:14,fontFamily:"var(--fn)",display:"flex",alignItems:"center",gap:5}}>← 내 클론 목록으로</button>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,padding:"14px 16px",background:"var(--sf)",borderRadius:12,border:`1px solid ${clone.color}33`}}>
          <Av char={clone.av} color={clone.color} size={44}/>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
              <span style={{fontSize:16,fontWeight:800}}>{clone.name}</span>
              <span style={{width:6,height:6,borderRadius:"50%",background:clone.active?"var(--gn)":"var(--sf3)"}}/>
              <span style={{fontSize:11,color:clone.active?"var(--gn)":"var(--tx3)"}}>{clone.active?"운영중":"대기중"}</span>
              <span style={{fontSize:11,color:"var(--tx3)",fontFamily:"var(--mo)"}}>{clone.v}</span>
            </div>
            <div style={{fontSize:12,color:"var(--tx2)"}}>{clone.subtitle}</div>
          </div>
          <Bt v={clone.active?"gh":"pr"} sz="sm" on={()=>updateClone(p=>({active:!p.active}))}>{clone.active?"운영 중단":"활성화"}</Bt>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:1,marginBottom:18,borderBottom:"1px solid var(--br)",overflowX:"auto"}}>
          {TABS.map(([k,l])=><button type="button" key={k} onClick={()=>setTab(k)} style={{padding:"5px 11px",border:"none",borderBottom:tab===k?"2px solid var(--cy)":"2px solid transparent",background:"transparent",fontSize:11,fontWeight:tab===k?700:400,color:tab===k?"var(--cy)":"var(--tx2)",cursor:"pointer",fontFamily:"var(--fn)",marginBottom:-1,whiteSpace:"nowrap"}}>{l}</button>)}
        </div>

        {/* ─── OVERVIEW ─── */}
        {tab==="overview"&&<div style={{animation:"fu 0.3s ease"}}>
          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:9,marginBottom:14}}>
            {[["구독자",clone.subs+"명","이번 달 +12","var(--cy)"],["이번 달 대화","3,847회","활성 기준","var(--gn)"],["미답변 피드백",FEEDBACKS.filter(f=>!f.replied).length+"건","답변 필요","var(--am)"]].map(([l,v,s,c])=>(
              <Cd key={l} style={{padding:"13px 14px"}}><div style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)",marginBottom:4}}>{l}</div><div style={{fontSize:20,fontWeight:800,color:c,lineHeight:1}}>{v}</div><div style={{fontSize:11,color:"var(--tx2)",marginTop:3}}>{s}</div></Cd>
            ))}
          </div>

          {/* Share link */}
          <Cd style={{padding:"14px 16px",marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:9}}>🔗 공유 링크</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              <div style={{flex:1,padding:"7px 11px",background:"var(--sf2)",borderRadius:7,fontFamily:"var(--mo)",fontSize:11,color:"var(--cy)",minWidth:140}}>clone.me/@{clone.name.replace(/\s|·/g,"").toLowerCase()}</div>
              <Bt v="sf" sz="sm">복사</Bt><Bt v="sf" sz="sm">QR</Bt><Bt v="sf" sz="sm">💬 카카오</Bt>
            </div>
          </Cd>

          {/* Pricing management */}
          <Cd style={{padding:"16px 18px",marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>💰 구독료 관리</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <label style={{fontSize:11,color:"var(--tx3)",fontFamily:"var(--mo)",display:"block",marginBottom:5}}>월 구독료 (원)</label>
                <input type="number" value={clone.price} onChange={e=>updateClone(()=>({price:Number(e.target.value)}))} step={1000} min={5000} style={{width:"100%",padding:"8px 10px",border:"1px solid var(--br2)",borderRadius:8,background:"var(--sf2)",color:"var(--tx)",fontSize:13,outline:"none",fontFamily:"var(--mo)"}}/>
              </div>
              <div>
                <label style={{fontSize:11,color:"var(--tx3)",fontFamily:"var(--mo)",display:"block",marginBottom:5}}>할인율 (%)</label>
                <input type="number" value={clone.discount} onChange={e=>updateClone(()=>({discount:Math.min(80,Math.max(0,Number(e.target.value)))}))} min={0} max={80} step={5} style={{width:"100%",padding:"8px 10px",border:"1px solid var(--br2)",borderRadius:8,background:"var(--sf2)",color:"var(--tx)",fontSize:13,outline:"none",fontFamily:"var(--mo)"}}/>
              </div>
            </div>
            {clone.discount>0&&<div style={{marginBottom:10}}>
              <label style={{fontSize:11,color:"var(--tx3)",fontFamily:"var(--mo)",display:"block",marginBottom:5}}>할인 종료일</label>
              <input type="text" value={clone.discountEnd} onChange={e=>updateClone(()=>({discountEnd:e.target.value}))} placeholder="예: 2025.03.31" style={{width:"100%",padding:"8px 10px",border:"1px solid var(--br2)",borderRadius:8,background:"var(--sf2)",color:"var(--tx)",fontSize:13,outline:"none",fontFamily:"var(--fn)"}}/>
            </div>}
            <div style={{padding:"9px 11px",background:"var(--sf2)",borderRadius:8,fontSize:12,display:"flex",gap:10}}>
              <span style={{color:"var(--tx2)"}}>구독자 실제 결제:</span>
              {clone.discount>0?<><span style={{textDecoration:"line-through",color:"var(--tx3)"}}>₩{clone.price.toLocaleString()}</span><span style={{color:"var(--am)",fontWeight:700,marginLeft:4}}>₩{Math.round(clone.price*(1-clone.discount/100)).toLocaleString()}/월</span><span style={{color:"var(--am)",fontSize:11}}>(할인 {clone.discount}%)</span></>:<span style={{fontWeight:700}}>₩{clone.price.toLocaleString()}/월</span>}
            </div>
          </Cd>

          {/* Clone similarity mini card */}
          {(()=>{
            const files=clone.files||[];
            const hasPDF=files.some(f=>f.type==="PDF"||f.type==="DOCX");
            const hasSRT=files.some(f=>f.type==="SRT");
            const hasTXT=files.some(f=>f.type==="TXT");
            const hasNotion=files.some(f=>f.type==="NOTION");
            const score=Math.min(100,Math.round((hasPDF?35:0)+(hasSRT?25:0)+(hasTXT?20:0)+(hasNotion?20:0)+(files.length>4?10:files.length*2)));
            const color=score>=75?"var(--gn)":score>=50?"var(--cy)":"var(--am)";
            return(
              <Cd style={{padding:"13px 16px",marginBottom:12,borderColor:`${color}33`}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{position:"relative",width:52,height:52,flexShrink:0}}>
                    <svg width="52" height="52" viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r="20" fill="none" stroke="var(--sf3)" strokeWidth="5"/>
                      <circle cx="26" cy="26" r="20" fill="none" stroke={color} strokeWidth="5"
                        strokeDasharray={`${2*Math.PI*20*score/100} ${2*Math.PI*20*(100-score)/100}`}
                        strokeDashoffset={`${2*Math.PI*20*.25}`} strokeLinecap="round"/>
                    </svg>
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:12,fontWeight:800,color}}>{score}%</span>
                    </div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>클론 유사도</div>
                    <div style={{fontSize:11,color:"var(--tx2)"}}>{score>=75?"나다운 대화 가능 ✓":score>=50?"자막·DM 자료 추가 권장":"강의 스크립트부터 업로드하세요"}</div>
                  </div>
                  <Bt v="gh" sz="sm" on={()=>setTab("clone")}>자세히 →</Bt>
                </div>
              </Cd>
            );
          })()}

          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            <Bt v="pr" sz="sm" on={()=>setTab("clone")}>+ 자료 추가</Bt>
            <Bt v="gh" sz="sm" on={()=>setTab("insight")}>인사이트</Bt>
            <Bt v="gh" sz="sm" on={()=>setTab("ops")}>운영</Bt>
          </div>
        </div>}

        {/* ════ 클론 관리 ════ */}
        {tab==="clone"&&<div style={{animation:"fu 0.3s ease"}}>

          {/* ── 섹션 헤더 ── */}
          {[["📦 자료 관리","materials-sec"],["🔗 외부 자료 연동","external-sec"],["🧠 답변 품질 & 유사도","quality-sec"],["🔐 보안 설정","security-sec"]].map(([l,id])=>(
            <div key={id} style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10,marginTop:id==="materials-sec"?0:28}}>{l}</div>
          )).slice(0,0) /* replaced inline below */}

          {/* ────────────── 자료 관리 ────────────── */}
          <div style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10}}>📦 자료 관리</div>

          {training!=="idle"&&<div style={{padding:"10px 14px",borderRadius:10,marginBottom:12,border:"1px solid var(--br2)",background:"var(--cyd)",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:14,height:14,borderRadius:"50%",border:"2px solid var(--cy)",borderTopColor:"transparent",animation:"sp 0.8s linear infinite",flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--cy)"}}>{training==="uploading"?"파일 업로드 중...":"클론 재학습 중..."}</div>
              <div style={{fontSize:11,color:"var(--tx2)",marginTop:1}}>{training==="uploading"?"암호화 후 저장하고 있습니다":"새 자료를 기반으로 클론을 업데이트합니다."}</div>
            </div>
            <Tg label={training==="uploading"?"업로드":"학습중"} c="cy"/>
          </div>}
          {dupWarning&&<div style={{padding:"10px 14px",borderRadius:10,marginBottom:12,border:"1px solid rgba(255,179,71,0.4)",background:"rgba(255,179,71,0.08)"}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--am)",marginBottom:4}}>⚠️ 중복 파일 건너뜀</div>
            {dupWarning.map(n=><div key={n} style={{fontSize:11,color:"var(--tx2)",fontFamily:"var(--mo)"}}>{n}</div>)}
            <button type="button" onClick={()=>setDupWarning(null)} style={{fontSize:11,color:"var(--am)",background:"none",border:"none",cursor:"pointer",fontFamily:"var(--mo)",textDecoration:"underline",marginTop:5}}>닫기</button>
          </div>}
          <Cd style={{padding:"14px 16px",marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:6}}>📤 자료 업로드</div>
            <div style={{fontSize:12,color:"var(--tx2)",marginBottom:9}}>기존 지식에 누적됩니다. 동일한 파일명은 중복 처리됩니다.</div>
            <input ref={matFileRef} type="file" multiple accept=".pdf,.docx,.txt,.srt" style={{display:"none"}} onChange={e=>handleAddFiles([...e.target.files])}/>
            {/* Drop zone + similarity badge side by side */}
            <div style={{display:"flex",gap:10,alignItems:"stretch"}}>
              <div onClick={()=>matFileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleAddFiles([...e.dataTransfer.files]);}}
                style={{flex:1,border:"2px dashed var(--br)",borderRadius:10,padding:"18px 14px",textAlign:"center",cursor:"pointer",transition:"all 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--cy)";e.currentTarget.style.background="var(--cyg)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--br)";e.currentTarget.style.background="transparent";}}>
                <div style={{fontSize:18,marginBottom:4}}>📂</div>
                <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>드래그 또는 클릭</div>
                <div style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)"}}>PDF · DOCX · TXT · SRT</div>
              </div>
              {/* Similarity badge */}
              {(()=>{
                const files=clone.files||[];
                const hasPDF=files.some(f=>f.type==="PDF"||f.type==="DOCX");
                const hasSRT=files.some(f=>f.type==="SRT");
                const hasTXT=files.some(f=>f.type==="TXT");
                const hasNotion=files.some(f=>f.type==="NOTION");
                const score=Math.min(100,Math.round((hasPDF?35:0)+(hasSRT?25:0)+(hasTXT?20:0)+(hasNotion?20:0)+(files.length>4?10:files.length*2)));
                const color=score>=75?"var(--gn)":score>=50?"var(--cy)":"var(--am)";
                return(
                  <div style={{width:90,flexShrink:0,borderRadius:10,border:`1px solid ${color}44`,background:`${color}08`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"10px 8px",gap:6}}>
                    <div style={{fontSize:22,fontWeight:800,color,lineHeight:1}}>{score}%</div>
                    <div style={{fontSize:9,color:"var(--tx3)",fontFamily:"var(--mo)",textAlign:"center",lineHeight:1.4}}>클론<br/>유사도</div>
                    <div style={{width:"100%",height:3,borderRadius:2,background:"var(--sf3)",overflow:"hidden"}}>
                      <div style={{height:"100%",width:score+"%",background:color,borderRadius:2,transition:"width 0.5s"}}/>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div style={{fontSize:11,color:"rgba(79,255,176,0.8)",fontFamily:"var(--mo)",marginTop:8}}>🔐 AES-256 암호화 저장</div>
          </Cd>
          <Cd style={{padding:"14px 16px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div>
                <div style={{fontSize:12,fontWeight:700}}>📚 현재 학습 자료</div>
                <div style={{fontSize:11,color:"var(--tx2)",marginTop:2}}>
                  총 {(clone.files||[]).length}개 · {((clone.files||[]).reduce((s,f)=>s+parseFloat(f.size),0)).toFixed(1)} MB · 약 {((clone.files||[]).reduce((s,f)=>s+(f.words||0),0)/10000).toFixed(1)}만 자
                </div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
                {Object.entries((clone.files||[]).reduce((acc,f)=>{acc[f.type]=(acc[f.type]||0)+1;return acc;},{})).map(([t,n])=>(
                  <span key={t} style={{padding:"2px 7px",borderRadius:4,fontSize:10,fontFamily:"var(--mo)",background:`${CAT_COLORS[t]||"var(--pu)"}18`,color:CAT_COLORS[t]||"var(--pu)"}}>{t} {n}</span>
                ))}
              </div>
            </div>
            {(clone.files||[]).length===0
              ?<div style={{padding:"14px",textAlign:"center",fontSize:12,color:"var(--tx3)"}}>아직 업로드된 자료가 없습니다</div>
              :<div style={{display:"flex",flexDirection:"column",gap:5}}>
                {(clone.files||[]).map((f)=>(
                  <div key={f.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"var(--sf2)",borderRadius:8,border:"1px solid var(--br)"}}>
                    <div style={{width:28,height:28,borderRadius:6,background:`${CAT_COLORS[f.type]||"var(--pu)"}18`,border:`1px solid ${CAT_COLORS[f.type]||"var(--pu)"}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:CAT_COLORS[f.type]||"var(--pu)",fontFamily:"var(--mo)",flexShrink:0}}>{f.type}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
                      <div style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)",marginTop:1,display:"flex",gap:8}}><span>{f.size}</span><span>{f.words?.toLocaleString()}자</span><span style={{color:"var(--cy)"}}>{f.ver}</span></div>
                    </div>
                    {deleteConfirm===f.id
                      ?<div style={{display:"flex",gap:5}}><button type="button" onClick={()=>handleDeleteFile(f.id,f.name)} style={{padding:"3px 8px",borderRadius:5,border:"1px solid var(--rd)",background:"var(--tg-rd-bg)",color:"var(--rd)",fontSize:11,cursor:"pointer",fontFamily:"var(--fn)"}}>삭제 확인</button><button type="button" onClick={()=>setDeleteConfirm(null)} style={{padding:"3px 7px",borderRadius:5,border:"1px solid var(--br)",background:"transparent",color:"var(--tx2)",fontSize:11,cursor:"pointer"}}>취소</button></div>
                      :<button type="button" onClick={()=>setDeleteConfirm(f.id)} style={{width:26,height:26,borderRadius:5,border:"1px solid var(--br)",background:"transparent",color:"var(--tx3)",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>🗑</button>
                    }
                  </div>
                ))}
              </div>
            }
          </Cd>

          {/* ────────────── 클론 테스트 ────────────── */}
          <div style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10,marginTop:14}}>🧪 내 클론 테스트</div>
          <Cd style={{padding:"14px 16px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div>
                <div style={{fontSize:12,fontWeight:700}}>출시 전 직접 테스트해보세요</div>
                <div style={{fontSize:11,color:"var(--tx2)",marginTop:1}}>구독자 입장에서 질문해보고 답변 품질을 확인합니다</div>
              </div>
              <Bt v={testOpen?"gh":"pr"} sz="sm" on={()=>{setTestOpen(v=>!v);if(!testOpen){setTestConvId(null);setTestMsgs([{r:"a",t:clone.welcomeMsg||`안녕하세요! ${clone.name}의 AI 클론입니다. (테스트)`,src:""}]);}}}>
                {testOpen?"닫기":"테스트 시작"}
              </Bt>
            </div>
            {testOpen&&<div style={{animation:"fu 0.25s ease"}}>
              <div style={{background:"rgba(255,179,71,0.07)",border:"1px solid rgba(255,179,71,0.25)",borderRadius:8,padding:"7px 11px",marginBottom:10,fontSize:11,color:"var(--am)",display:"flex",gap:6,alignItems:"center"}}>
                <span>⚡</span><span>테스트 모드 — 로그인 + DB 클론이면 /api/chat(RAG)과 동일합니다.</span>
              </div>
              <div style={{marginBottom:12,border:"1px solid var(--br2)",borderRadius:10,overflow:"hidden",background:"var(--sf2)"}}>
                <button type="button" onClick={()=>setScenarioPanelOpen(v=>!v)} style={{width:"100%",padding:"10px 12px",border:"none",background:"var(--cyd)",color:"var(--cy)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--fn)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>📋 구조화 테스트 10종 (PRD)</span>
                  <span>{scenarioPanelOpen?"▲":"▼"}</span>
                </button>
                {scenarioPanelOpen&&<div style={{padding:"10px 12px 12px",maxHeight:320,overflowY:"auto"}}>
                  {testScenarios.map((sc)=>(
                    <div key={sc.id} style={{marginBottom:10,paddingBottom:10,borderBottom:"1px solid var(--br)"}}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:11,fontWeight:800,color:"var(--tx)",marginBottom:4}}>{sc.id}. {sc.title}</div>
                          <div style={{fontSize:10,color:"var(--tx2)",lineHeight:1.5,marginBottom:6}}>기대: {sc.hint}</div>
                          {!sc.multi&&<div style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)",padding:"6px 8px",background:"var(--sf)",borderRadius:6,border:"1px solid var(--br)",lineHeight:1.45}}>{sc.question}</div>}
                          {sc.multi&&sc.steps?.map((st,i)=><div key={i} style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)",padding:"5px 8px",background:"var(--sf)",borderRadius:6,marginBottom:4,border:"1px solid var(--br)"}}>{i+1}) {st}</div>)}
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                          {!sc.multi&&<>
                            <Bt v="gh" sz="sm" on={()=>setTestInp(sc.question)}>입력란에 넣기</Bt>
                            <Bt v="pr" sz="sm" dis={testLoad} on={()=>testSend(sc.question)}>바로 전송</Bt>
                          </>}
                          {sc.multi&&sc.steps?.map((st,i)=><Bt key={i} v="pr" sz="sm" dis={testLoad} on={()=>testSend(st)} style={{fontSize:10}}>{i+1}번 전송</Bt>)}
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8}}>
                        <span style={{fontSize:9,color:"var(--tx3)",fontFamily:"var(--mo)"}}>자가평가</span>
                        {["ok","warn","bad"].map((k)=>(
                          <button key={k} type="button" onClick={()=>setScenarioMarks(p=>({...p,[sc.id]:k}))} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${scenarioMarks[sc.id]===k?"var(--cy)":"var(--br)"}`,background:scenarioMarks[sc.id]===k?"var(--cyd)":"transparent",fontSize:10,cursor:"pointer",fontFamily:"var(--mo)",color:scenarioMarks[sc.id]===k?"var(--cy)":"var(--tx3)"}}>
                            {k==="ok"?"✅":k==="warn"?"⚠️":"❌"}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div style={{fontSize:10,color:"var(--tx3)",marginTop:6,lineHeight:1.5}}>※ 자가평가는 브라우저에만 저장됩니다. 실제 리포트·점수는 Phase 4 예정.</div>
                </div>}
              </div>
              {/* Mini chat */}
              <div style={{background:"var(--sf2)",borderRadius:10,border:"1px solid var(--br)",overflow:"hidden"}}>
                <div style={{height:280,overflowY:"auto",padding:"12px 12px",display:"flex",flexDirection:"column",gap:9}} ref={testRef}>
                  {testMsgs.map((m,i)=>(
                    <div key={i} style={{display:"flex",gap:7,flexDirection:m.r==="u"?"row-reverse":"row"}}>
                      {m.r==="a"&&<Av char={clone.av} color={clone.color} size={22}/>}
                      <div style={{maxWidth:"78%"}}>
                        <div style={{padding:"8px 11px",borderRadius:10,background:m.r==="u"?"var(--cyd)":"var(--sf)",border:m.r==="u"?"1px solid var(--br2)":"1px solid var(--br)",fontSize:12,lineHeight:1.6,color:"var(--tx)",borderTopRightRadius:m.r==="u"?2:10,borderTopLeftRadius:m.r==="a"?2:10,whiteSpace:"pre-wrap"}}>
                          {m.t}
                        </div>
                        {m.src&&<div style={{fontSize:9,color:m.src?.includes("고정")?"var(--go)":m.src==="RAG+Claude"?"var(--cy)":"var(--tx3)",fontFamily:"var(--mo)",marginTop:2,paddingLeft:4}}>
                          {m.src?.includes("고정")?"📌 고정 답변":m.src==="RAG+Claude"?"📚 RAG+Claude":m.src==="Claude"?"🤖 Claude":m.src||""}
                        </div>}
                        {m.r==="a"&&m.sources?.length>0&&<div style={{marginTop:6,padding:"6px 8px",borderRadius:6,background:"var(--cyg)",border:"1px solid var(--br2)",fontSize:9,color:"var(--tx2)",fontFamily:"var(--mo)",lineHeight:1.45}}>
                          <div style={{color:"var(--cy)",marginBottom:4}}>출처</div>
                          {m.sources.map((s,j)=>{
                            const ft=(s.file_type||"").toUpperCase();
                            const line=ft==="SRT"?`📺 ${s.file_name||""}${s.timestamp_start?` · ${s.timestamp_start}`:""}`:`📄 ${s.file_name||""}${s.page_number!=null?` · ${s.page_number}p`:""}${s.section_title?` · ${s.section_title}`:""}`;
                            return <div key={s.chunk_id||j}>{line}</div>;
                          })}
                        </div>}
                      </div>
                    </div>
                  ))}
                  {testLoad&&<div style={{display:"flex",gap:7}}><Av char={clone.av} color={clone.color} size={22}/><div style={{padding:"8px 11px",borderRadius:10,borderTopLeftRadius:2,background:"var(--sf)",border:"1px solid var(--br)",display:"flex",gap:3,alignItems:"center"}}>{[0,1,2].map(n=><div key={n} style={{width:4,height:4,borderRadius:"50%",background:clone.color,animation:`d3 1.2s ${n*.2}s infinite`}}/>)}</div></div>}
                </div>
                <div style={{borderTop:"1px solid var(--br)",padding:"8px 10px",display:"flex",gap:7,background:"var(--sf)"}}>
                  <input value={testInp} onChange={e=>setTestInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&testSend()} placeholder="구독자 입장에서 질문해보세요..." style={{flex:1,padding:"7px 10px",border:"1px solid var(--br)",borderRadius:8,background:"var(--sf2)",color:"var(--tx)",fontSize:12,outline:"none",fontFamily:"var(--fn)"}}/>
                  <button type="button" onClick={()=>testSend()} disabled={!testInp.trim()||testLoad} style={{padding:"7px 14px",borderRadius:8,border:"none",background:clone.color||"var(--cy)",color:"#000",fontSize:11,fontWeight:700,cursor:testInp.trim()&&!testLoad?"pointer":"not-allowed",opacity:testInp.trim()&&!testLoad?1:0.4,fontFamily:"var(--fn)"}}>전송</button>
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:7}}>
                <button type="button" onClick={()=>{setTestConvId(null);setTestMsgs([{r:"a",t:clone.welcomeMsg||"테스트 시작",src:""}]);}} style={{fontSize:10,color:"var(--tx3)",background:"none",border:"none",cursor:"pointer",fontFamily:"var(--mo)",textDecoration:"underline"}}>대화 초기화</button>
              </div>
            </div>}
          </Cd>

          {/* ── 고급 설정 토글 (클론 관리) ── */}
          <button type="button" onClick={()=>setShowAdvanced(v=>!v)}
            style={{width:"100%",padding:"9px",borderRadius:9,border:"1px solid var(--br)",background:"transparent",color:showAdvanced?"var(--cy)":"var(--tx2)",fontSize:12,cursor:"pointer",fontFamily:"var(--fn)",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:showAdvanced?16:0,transition:"all 0.2s"}}>
            <span style={{fontSize:14}}>{showAdvanced?"▲":"▼"}</span>
            {showAdvanced?"고급 설정 접기":"고급 설정 보기 — 버전 히스토리 · 외부 연동 · 답변 품질 · 보안"}
          </button>
          {showAdvanced&&<div style={{animation:"fu 0.25s ease"}}>
          <Cd style={{padding:"14px 16px",marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>📋 버전 히스토리 <span style={{fontSize:10,color:"var(--tx3)",fontWeight:400}}>클릭해서 자료 목록 확인</span></div>
            {[{v:clone.v||"v4",date:"2025.01.15",note:"협상 케이스 20개 추가"},{v:"v3",date:"2025.01.08",note:"콜드메일 자료 보강"},{v:"v2",date:"2024.12.20",note:"초기 자료 확장"},{v:"v1",date:"2024.12.01",note:"최초 출시"}].map((ver,i)=>{
              const vFiles=VER_FILES[ver.v]||[];
              return <div key={ver.v} style={{marginBottom:5}}>
                <div onClick={()=>setExpandedVer(expandedVer===ver.v?null:ver.v)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"8px 11px",background:i===0?"var(--cyd)":"var(--sf2)",borderRadius:expandedVer===ver.v?"8px 8px 0 0":8,border:i===0?"1px solid var(--br2)":"1px solid var(--br)",cursor:"pointer"}}>
                  <div style={{textAlign:"center",minWidth:24}}><div style={{fontSize:11,fontWeight:800,color:i===0?"var(--cy)":"var(--tx2)",fontFamily:"var(--mo)"}}>{ver.v}</div>{i===0&&<div style={{fontSize:8,color:"var(--cy)",fontFamily:"var(--mo)"}}>현재</div>}</div>
                  <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{ver.note}</div><div style={{fontSize:10,color:"var(--tx2)",fontFamily:"var(--mo)",marginTop:1}}>{ver.date} · {vFiles.length}개</div></div>
                  <div style={{display:"flex",gap:5,alignItems:"center"}}>{i>0&&<Bt v="gh" sz="sm" on={e=>e.stopPropagation()}>롤백</Bt>}<span style={{fontSize:10,color:"var(--tx3)"}}>{expandedVer===ver.v?"▲":"▼"}</span></div>
                </div>
                {expandedVer===ver.v&&<div style={{background:"var(--sf3)",border:"1px solid var(--br)",borderTop:"none",borderRadius:"0 0 8px 8px",padding:"9px 10px",animation:"fu 0.2s ease"}}>
                  {vFiles.length===0?<div style={{fontSize:11,color:"var(--tx3)",textAlign:"center",padding:"6px"}}>파일 없음</div>
                  :vFiles.map(f=><div key={f.id} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 8px",background:"var(--sf2)",borderRadius:6,marginBottom:4,border:"1px solid var(--br)"}}>
                    <div style={{width:26,height:26,borderRadius:5,background:`${FTYPE_C[f.type]||"var(--pu)"}18`,border:`1px solid ${FTYPE_C[f.type]||"var(--pu)"}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:FTYPE_C[f.type]||"var(--pu)",fontFamily:"var(--mo)",flexShrink:0}}>{f.type}</div>
                    <div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div><div style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)",marginTop:1}}>{f.size}{f.words?` · ${f.words.toLocaleString()}자`:""}</div></div>
                    {f.type==="NOTION"?<a href={f.url} target="_blank" rel="noopener noreferrer" style={{padding:"3px 9px",borderRadius:5,background:"rgba(183,148,255,0.1)",color:"var(--pu)",fontSize:10,textDecoration:"none",fontFamily:"var(--mo)",border:"1px solid rgba(183,148,255,0.3)",flexShrink:0}}>열기 →</a>
                    :<button type="button" style={{padding:"3px 9px",borderRadius:5,background:"var(--sf)",color:"var(--tx2)",fontSize:10,cursor:"pointer",fontFamily:"var(--mo)",border:"1px solid var(--br)",flexShrink:0}}>미리보기</button>}
                  </div>)}
                </div>}
              </div>;
            })}
          </Cd>

          {/* ────────────── 외부 자료 연동 ────────────── */}
          <div style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10,marginTop:24}}>🔗 외부 자료 연동</div>
          <Cd style={{padding:"14px 16px",marginBottom:10}}>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
              <div style={{width:34,height:34,borderRadius:8,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#000",flexShrink:0}}>N</div>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700}}>Notion 워크스페이스</div><div style={{fontSize:10,color:"var(--gn)",fontFamily:"var(--mo)",marginTop:1}}>● kimb2b.notion.site · 연결됨 · 주 1회 자동 싱크</div></div>
              <Bt v="gh" sz="sm">설정</Bt>
            </div>
            {[{t:"B2B 영업 전략 노트",w:4200,st:"synced"},{t:"콜드메일 템플릿 모음",w:1800,st:"synced"},{t:"협상 케이스스터디 20선",w:8100,st:"changed"},{t:"2025 영업 트렌드",w:0,st:"new"}].map((p,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid var(--br)"}}>
                <span style={{fontSize:12}}>📋</span>
                <div style={{flex:1}}><div style={{fontSize:11,fontWeight:600}}>{p.t}</div><div style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)"}}>{p.w>0?p.w.toLocaleString()+"자":"미연결"}</div></div>
                <span style={{padding:"2px 7px",borderRadius:4,fontSize:10,fontFamily:"var(--mo)",background:p.st==="synced"?"rgba(79,255,176,0.08)":p.st==="changed"?"rgba(255,179,71,0.08)":"var(--cyd)",color:p.st==="synced"?"var(--gn)":p.st==="changed"?"var(--am)":"var(--cy)"}}>{p.st==="synced"?"✓ 동기화":p.st==="changed"?"변경 감지":"+ 추가 가능"}</span>
              </div>
            ))}
            <div style={{marginTop:8,display:"flex",justifyContent:"flex-end"}}><Bt v="sf" sz="sm">지금 싱크</Bt></div>
          </Cd>
          <Cd style={{padding:"14px 16px",marginBottom:10}}>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
              <div style={{width:34,height:34,borderRadius:8,background:"rgba(255,85,85,0.12)",border:"1px solid rgba(255,85,85,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>▶</div>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700}}>YouTube 자막 자동 추출</div><div style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)",marginTop:1}}>미연결 — 채널 연결 후 영상 자막 자동 수집</div></div>
              <Bt v="pr" sz="sm" style={{background:"#ff5555"}}>연결하기</Bt>
            </div>
            <div style={{padding:"8px 11px",background:"rgba(255,85,85,0.06)",border:"1px solid rgba(255,85,85,0.15)",borderRadius:8,fontSize:11,color:"var(--tx2)"}}>📺 채널 연결 시 영상 자막이 자동 수집됩니다. 톤 & 스타일 학습에 가장 효과적인 자료입니다.</div>
          </Cd>

          {/* ────────────── 답변 품질 & 유사도 ────────────── */}
          <div style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10,marginTop:24}}>🧠 답변 품질 & 유사도</div>
          {(()=>{
            const files=clone.files||[];
            const hasPDF=files.some(f=>f.type==="PDF"||f.type==="DOCX"),hasSRT=files.some(f=>f.type==="SRT"),hasTXT=files.some(f=>f.type==="TXT"),hasNotion=files.some(f=>f.type==="NOTION");
            const score=Math.min(100,Math.round((hasPDF?35:0)+(hasSRT?25:0)+(hasTXT?20:0)+(hasNotion?20:0)+(files.length>4?10:files.length*2)));
            const color=score>=75?"var(--gn)":score>=50?"var(--cy)":"var(--am)";
            return(
              <Cd style={{padding:"14px 16px",marginBottom:10,borderColor:`${color}33`}}>
                <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:10}}>
                  <div style={{position:"relative",width:56,height:56,flexShrink:0}}>
                    <svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="22" fill="none" stroke="var(--sf3)" strokeWidth="5"/><circle cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="5" strokeDasharray={`${2*Math.PI*22*score/100} ${2*Math.PI*22*(100-score)/100}`} strokeDashoffset={`${2*Math.PI*22*.25}`} strokeLinecap="round"/></svg>
                    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:14,fontWeight:800,color,lineHeight:1}}>{score}%</span>
                      <span style={{fontSize:8,color:"var(--tx3)",fontFamily:"var(--mo)"}}>유사도</span>
                    </div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>{score>=75?"나다운 대화 가능 ✓":score>=50?"기본 대화 가능":"자료 보강 필요"}</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {[["PDF/DOCX",hasPDF,35],["자막(.srt)",hasSRT,25],["FAQ/TXT",hasTXT,20],["Notion",hasNotion,20]].map(([l,ok,w])=>(
                        <span key={l} style={{padding:"2px 8px",borderRadius:4,fontSize:10,background:ok?"rgba(79,255,176,0.1)":"var(--sf2)",color:ok?"var(--gn)":"var(--tx3)",border:`1px solid ${ok?"rgba(79,255,176,0.3)":"var(--br)"}`}}>{ok?"✓":"○"} {l} +{w}%</span>
                      ))}
                    </div>
                  </div>
                </div>
                <Bt v="sf" sz="sm" on={()=>matFileRef.current?.click()}>+ 자료 추가해서 유사도 높이기</Bt>
              </Cd>
            );
          })()}
          <Cd style={{padding:"14px 16px",marginBottom:10}}>
            {[
              {k:"noAnswer",label:"모르는 질문 처리",desc:"자료에 없는 내용은 모르겠다고 명확히 답변",tag:"명예 보호",tc:"gn"},
              {k:"toneStyle",label:"톤 & 스타일 학습",desc:"업로드된 자료의 말투·표현 방식 그대로 사용",tag:"권장",tc:"cy"},
              {k:"citation",label:"인용 출처 표시",desc:"어느 자료에서 답변했는지 구독자에게 표시 — 신뢰도 향상",tag:"권장",tc:"gn"},
            ].map(({k,label,desc,tag,tc})=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"11px 0",borderBottom:"1px solid var(--br)"}}>
                <div style={{flex:1,marginRight:14}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}><span style={{fontSize:12,fontWeight:600}}>{label}</span><Tg label={tag} c={tc}/></div><div style={{fontSize:11,color:"var(--tx2)"}}>{desc}</div></div>
                <Sw on={clone.quality?.[k]} onChange={v=>updateClone(p=>({quality:{...p.quality,[k]:v}}))}/>
              </div>
            ))}
          </Cd>


          {/* ────────────── 고정 답변 등록 ────────────── */}
          <div style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10,marginTop:24}}>📌 고정 답변 등록</div>
          <Cd style={{padding:"14px 16px",marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:4}}>특정 질문에 항상 이 답변을 하도록 설정</div>
            <div style={{fontSize:11,color:"var(--tx2)",marginBottom:12,lineHeight:1.6}}>
              자주 오는 질문, 민감한 질문, AI가 틀리기 쉬운 질문에 강사가 직접 답변을 등록합니다. 고정 답변이 AI보다 우선합니다.
            </div>
            {fixedQA.map((fq,i)=>(
              <div key={fq.id} style={{marginBottom:7}}>
                <div onClick={()=>setFqOpen(fqOpen===fq.id?null:fq.id)}
                  style={{display:"flex",alignItems:"center",gap:9,padding:"9px 11px",background:"var(--sf2)",borderRadius:fqOpen===fq.id?"8px 8px 0 0":8,border:"1px solid var(--br2)",cursor:"pointer"}}>
                  <span style={{fontSize:11,color:"var(--go)",flexShrink:0}}>📌</span>
                  <div style={{flex:1,fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fq.q}</div>
                  <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
                    <button type="button" onClick={e=>{e.stopPropagation();setFixedQA(p=>p.filter(f=>f.id!==fq.id));}} style={{background:"none",border:"none",color:"var(--tx3)",cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>
                    <span style={{fontSize:10,color:"var(--tx3)"}}>{fqOpen===fq.id?"▲":"▼"}</span>
                  </div>
                </div>
                {fqOpen===fq.id&&<div style={{padding:"10px 12px",background:"var(--sf3)",border:"1px solid var(--br2)",borderTop:"none",borderRadius:"0 0 8px 8px",animation:"fu 0.2s ease"}}>
                  <div style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)",marginBottom:5}}>질문</div>
                  <input value={fq.q} onChange={e=>setFixedQA(p=>p.map(f=>f.id===fq.id?{...f,q:e.target.value}:f))} style={{width:"100%",padding:"6px 9px",border:"1px solid var(--br)",borderRadius:7,background:"var(--sf2)",color:"var(--tx)",fontSize:11,outline:"none",fontFamily:"var(--fn)",marginBottom:8}}/>
                  <div style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)",marginBottom:5}}>고정 답변</div>
                  <textarea value={fq.a} onChange={e=>setFixedQA(p=>p.map(f=>f.id===fq.id?{...f,a:e.target.value}:f))} style={{width:"100%",padding:"6px 9px",border:"1px solid var(--br)",borderRadius:7,background:"var(--sf2)",color:"var(--tx)",fontSize:11,outline:"none",fontFamily:"var(--fn)",resize:"none",height:68,lineHeight:1.5}}/>
                </div>}
              </div>
            ))}
            <Cd style={{padding:"12px 13px",marginTop:4}}>
              <div style={{fontSize:11,fontWeight:700,marginBottom:8}}>+ 새 고정 답변 추가</div>
              <input value={newFQ.q} onChange={e=>setNewFQ(p=>({...p,q:e.target.value}))} placeholder="자주 오는 질문 (예: AI 아닌가요?)" style={{width:"100%",padding:"7px 9px",border:"1px solid var(--br)",borderRadius:7,background:"var(--sf2)",color:"var(--tx)",fontSize:11,outline:"none",fontFamily:"var(--fn)",marginBottom:6}}/>
              <textarea value={newFQ.a} onChange={e=>setNewFQ(p=>({...p,a:e.target.value}))} placeholder="등록할 고정 답변..." style={{width:"100%",padding:"7px 9px",border:"1px solid var(--br)",borderRadius:7,background:"var(--sf2)",color:"var(--tx)",fontSize:11,outline:"none",fontFamily:"var(--fn)",resize:"none",height:60,lineHeight:1.5,marginBottom:7}}/>
              <Bt v="pr" sz="sm" dis={!newFQ.q||!newFQ.a} on={()=>{setFixedQA(p=>[...p,{id:"fq"+Date.now(),q:newFQ.q,a:newFQ.a}]);setNewFQ({q:"",a:""});}}>등록하기</Bt>
            </Cd>
          </Cd>

          {/* ────────────── 보안 설정 ────────────── */}
          <div style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10,marginTop:24}}>🔐 보안 설정</div>
          <Cd style={{padding:"14px 16px",marginBottom:10}}>
            {[{key:"deleteAfterTraining",label:"학습 완료 후 원본 파일 삭제",desc:"AI 학습 후 원본 자동 삭제. 벡터 인덱스만 유지.",def:true},{key:"anonymizeConversations",label:"대화 내용 익명화 저장",desc:"구독자 개인정보 익명 처리 후 통계로만 저장.",def:true},{key:"blockThirdPartyAccess",label:"제3자 자료 접근 차단",def:true},{key:"retainVersions",label:"버전 히스토리 보관",desc:"OFF 시 이전 버전 자료가 완전 삭제됩니다.",def:true}].map(({key,label,desc,def})=>(
              <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 0",borderBottom:"1px solid var(--br)"}}>
                <div style={{flex:1,marginRight:14}}><div style={{fontSize:12,fontWeight:600,marginBottom:1}}>{label}</div>{desc&&<div style={{fontSize:11,color:"var(--tx3)"}}>{desc}</div>}</div>
                <Sw on={def} onChange={()=>{}}/>
              </div>
            ))}
          </Cd>
          <Cd style={{padding:"12px 14px",borderColor:"rgba(255,79,109,0.2)"}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--rd)",marginBottom:8}}>⚠️ 위험 구역</div>
            <div style={{display:"flex",gap:8}}>
              {["모든 자료 즉시 삭제","클론 초기화"].map(l=>(
                <button type="button" key={l} style={{flex:1,padding:"7px",borderRadius:7,border:"1px solid var(--err-border)",background:"var(--err-surface)",color:"var(--rd)",fontSize:11,cursor:"pointer",fontFamily:"var(--fn)"}}>{l}</button>
              ))}
            </div>
          </Cd>
          </div>}  {/* end showAdvanced */}
        </div>}

        {/* ════ 인사이트 ════ */}
        {tab==="insight"&&<div style={{animation:"fu 0.3s ease"}}>

          {/* ── 자료별 참조 현황 (PRD 인사이트) ── */}
          <div style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10}}>📎 자료별 참조 현황</div>
          <Cd style={{padding:"13px 15px",marginBottom:14}}>
            <div style={{fontSize:11,color:"var(--tx2)",lineHeight:1.55,marginBottom:10}}>
              RAG 답변에 쓰인 학습 파일별 <b style={{color:"var(--tx)"}}>청크 인용 횟수</b>를 월 단위로 집계합니다. (<code style={{fontSize:10}}>file_reference_stats</code>)
            </div>
            {!UUID_RE.test(String(clone.id||""))&&(
              <div style={{fontSize:11,color:"var(--tx3)",padding:"10px",background:"var(--sf2)",borderRadius:8}}>데모 클론 ID는 DB와 연결되지 않습니다. 대시보드에서 생성한 클론에서 확인하세요.</div>
            )}
            {UUID_RE.test(String(clone.id||""))&&<>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center",marginBottom:10}}>
                <select value={refPeriodFilter} onChange={e=>setRefPeriodFilter(e.target.value)} style={{padding:"6px 10px",borderRadius:7,border:"1px solid var(--br2)",background:"var(--sf2)",color:"var(--tx)",fontSize:11,outline:"none",fontFamily:"var(--mo)",cursor:"pointer"}}>
                  <option value="all">전체 기간 합산</option>
                  {fileRefPeriods.map(p=><option key={p} value={p}>{p.replace("-","년 ")}월{p===fileRefCurMonth?" (이번 달)":""}</option>)}
                </select>
                <Bt v="sf" sz="sm" dis={fileRefLoading} on={()=>setFileRefTick(t=>t+1)} style={{fontSize:10}}>새로고침</Bt>
                {fileRefLoading&&<span style={{fontSize:10,color:"var(--tx3)"}}>불러오는 중…</span>}
              </div>
              {fileRefErr&&<div style={{fontSize:11,color:"var(--rd)",marginBottom:8}}>{fileRefErr}</div>}
              {!fileRefLoading&&!fileRefErr&&(!fileRefRows||fileRefRows.length===0)&&(
                <div style={{fontSize:11,color:"var(--tx3)",textAlign:"center",padding:"14px"}}>아직 참조 기록이 없습니다. 구독자·테스트 채팅에서 자료 기반(RAG) 답변이 나오면 집계됩니다.</div>
              )}
              {!fileRefLoading&&!fileRefErr&&fileRefRows?.length>0&&fileRefDisplay.length===0&&refPeriodFilter!=="all"&&(
                <div style={{fontSize:11,color:"var(--tx3)",textAlign:"center",padding:"14px"}}>선택한 월({refPeriodFilter})에는 참조 기록이 없습니다. 다른 월을 선택하거나 「전체 기간 합산」을 보세요.</div>
              )}
              {!fileRefLoading&&fileRefDisplay.length>0&&(
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {fileRefDisplay.map((row,i)=>{
                    const ext=row.type||((row.name||"").split(".").pop()||"").toUpperCase();
                    const col=CAT_COLORS[ext]||FTYPE_C[ext]||"var(--tx2)";
                    const max=Math.max(...fileRefDisplay.map(x=>x.count),1);
                    return(
                      <div key={row.file_id+"-"+i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"var(--sf2)",borderRadius:8,border:"1px solid var(--br2)"}}>
                        <span style={{fontSize:10,fontWeight:700,minWidth:36,color:col,fontFamily:"var(--mo)"}}>{ext||"—"}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.name}</div>
                          <div style={{marginTop:4,height:4,background:"var(--sf3)",borderRadius:2,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${(row.count/max)*100}%`,background:"var(--cy)",borderRadius:2}}/>
                          </div>
                        </div>
                        <span style={{fontSize:12,fontWeight:800,color:"var(--cy)",minWidth:40,textAlign:"right",fontFamily:"var(--mo)"}}>{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>}
          </Cd>

          {/* ── 피드백 ── */}
          <div style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10}}>💬 피드백</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
            {[["평균 평점","4.4 ★","var(--go)"],["총 피드백","4건","var(--cy)"],["미답변",FEEDBACKS.filter(f=>!f.replied).length+"건","var(--am)"]].map(([l,v,c])=>(
              <Cd key={l} style={{padding:"11px 12px",textAlign:"center"}}><div style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)",marginBottom:3}}>{l}</div><div style={{fontSize:16,fontWeight:800,color:c}}>{v}</div></Cd>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:10}}>
            {FEEDBACKS.map(fb=>(
              <Cd key={fb.id} style={{padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><div><div style={{fontSize:10,fontFamily:"var(--mo)",color:"var(--tx3)"}}>{fb.user} · {fb.demo}</div></div><div style={{textAlign:"right"}}><div>{[1,2,3,4,5].map(n=><span key={n} style={{fontSize:12,color:n<=fb.rating?"var(--go)":"var(--sf3)"}}>★</span>)}</div><div style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)"}}>{fb.date}</div></div></div>
                <p style={{fontSize:12,lineHeight:1.6,marginBottom:fb.replied||replyOpen===fb.id?7:0}}>{fb.msg}</p>
                {fb.replied&&<div style={{background:"var(--cyd)",border:"1px solid var(--br2)",borderRadius:7,padding:"7px 10px",fontSize:11,color:"var(--tx2)"}}><span style={{color:"var(--cy)",fontWeight:700,marginRight:5}}>강사:</span>{fb.reply}</div>}
                {!fb.replied&&replyOpen!==fb.id&&<button type="button" onClick={()=>setReplyOpen(fb.id)} style={{fontSize:10,color:"var(--cy)",background:"none",border:"none",cursor:"pointer",fontFamily:"var(--mo)",textDecoration:"underline"}}>답변 달기</button>}
                {replyOpen===fb.id&&<div><textarea value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="답변..." style={{width:"100%",padding:"7px 9px",border:"1px solid var(--br2)",borderRadius:7,background:"var(--sf2)",color:"var(--tx)",fontSize:11,outline:"none",fontFamily:"var(--fn)",resize:"none",height:56,lineHeight:1.5,marginBottom:6}}/><div style={{display:"flex",gap:6}}><Bt v="pr" sz="sm" on={()=>{setReplyOpen(null);setReplyText("");}}>게시</Bt><Bt v="gh" sz="sm" on={()=>{setReplyOpen(null);setReplyText("");}}>취소</Bt></div></div>}
              </Cd>
            ))}
          </div>

          {/* ── 수익 ── */}
          <div style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10,marginTop:14}}>💰 수익</div>
          <Cd style={{padding:"13px 15px",marginBottom:10}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,borderRadius:8,overflow:"hidden",border:"1px solid var(--br)"}}>
              {[["총 구독","₩824,000","var(--tx)"],["플랫폼 비용","−₩206,000","var(--rd)"],["내 수령액","₩618,000","var(--gn)"]].map(([l,v,c])=>(
                <div key={l} style={{padding:"11px 9px",background:"var(--sf2)",textAlign:"center"}}><div style={{fontSize:9,color:"var(--tx3)",fontFamily:"var(--mo)",marginBottom:3}}>{l}</div><div style={{fontSize:14,fontWeight:800,color:c}}>{v}</div></div>
              ))}
            </div>
          </Cd>
          <Cd style={{padding:"13px 15px"}}>
            {[["2025년 1월",618000],["2024년 12월",512000],["2024년 11월",387000],["2024년 10월",241000]].map(([m,e])=>(
              <div key={m} style={{display:"flex",alignItems:"center",gap:9,marginBottom:6}}>
                <span style={{fontSize:10,color:"var(--tx2)",minWidth:76,fontFamily:"var(--mo)"}}>{m}</span>
                <div style={{flex:1,height:4,background:"var(--sf3)",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${(e/618000)*100}%`,background:"var(--cy)",borderRadius:2}}/></div>
                <span style={{fontSize:11,fontWeight:700,minWidth:44,textAlign:"right"}}>₩{(e/10000).toFixed(0)}만</span>
              </div>
            ))}
          </Cd>

          {/* ── 프로필 베스트 Q&A 선택 ── */}
          <div style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10,marginTop:24}}>⭐ 프로필 샘플 대화 관리</div>
          <Cd style={{padding:"14px 16px",marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:4}}>구매자에게 보여줄 베스트 Q&A</div>
            <div style={{fontSize:11,color:"var(--tx2)",marginBottom:12,lineHeight:1.6}}>
              대화 이력에서 선택하거나 직접 작성하세요. 프로필 "샘플 대화" 탭에 노출됩니다. <span style={{color:"var(--cy)"}}>최대 3개</span>
            </div>
            {/* Pinned Q&As */}
            {[
              {q:"콜드콜에서 첫 마디를 어떻게 시작해야 할까요?",a:"회사명이나 직함으로 시작하지 마세요. '지금 잠깐 괜찮으세요?'로 시작하세요.",pinned:true,src:"대화 이력"},
              {q:"거절당했을 때 어떻게 재접근하면 좋을까요?",a:"최소 2주는 기다리세요. 재접근 시엔 새로운 가치 제안으로 시작해야 합니다.",pinned:true,src:"대화 이력"},
              {q:"가격 협상에서 먼저 숫자를 제시해야 하나요?",a:"앵커링 효과를 활용하세요. 먼저 제시하는 숫자가 협상의 기준점이 됩니다.",pinned:true,src:"직접 작성"},
            ].map((qa,i)=>(
              <div key={i} style={{padding:"10px 12px",background:"var(--sf2)",borderRadius:8,marginBottom:7,border:"1px solid var(--br2)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:11,color:"var(--go)"}}>★ {i+1}</span>
                    <Tg label={qa.src} c="cy"/>
                  </div>
                  <button type="button" style={{background:"none",border:"none",color:"var(--tx3)",cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>
                </div>
                <div style={{fontSize:12,fontWeight:600,marginBottom:4,color:"var(--tx)"}}>{qa.q}</div>
                <div style={{fontSize:11,color:"var(--tx2)",lineHeight:1.5,padding:"6px 9px",background:"var(--sf)",borderRadius:6,borderLeft:"2px solid var(--cy)"}}>{qa.a}</div>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:6}}>
              <Bt v="sf" sz="sm" style={{flex:1,justifyContent:"center"}}>+ 대화 이력에서 선택</Bt>
              <Bt v="gh" sz="sm" style={{flex:1,justifyContent:"center"}}>+ 직접 작성</Bt>
            </div>
          </Cd>

          {/* ── 리포트 ── */}
          <div style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10,marginTop:24}}>📋 리포트</div>
          <Cd style={{padding:"13px 15px",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,marginBottom:10}}>조회 기간</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
              <select value={rYear} onChange={e=>setRYear(Number(e.target.value))} style={{padding:"6px 10px",borderRadius:7,border:"1px solid var(--br2)",background:"var(--sf2)",color:"var(--tx)",fontSize:11,outline:"none",fontFamily:"var(--mo)",cursor:"pointer"}}>
                {[2025,2024].map(y=><option key={y} value={y}>{y}년</option>)}
              </select>
              <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m=>{
                  const key=`${rYear}-${String(m).padStart(2,"0")}`;
                  const hasData=!!REPORT_DATA[key];
                  return <button type="button" key={m} onClick={()=>setRMonth(m)} disabled={!hasData} style={{width:32,height:28,borderRadius:6,border:`1px solid ${rMonth===m?"var(--cy)":"var(--br)"}`,background:rMonth===m?"var(--cyd)":hasData?"var(--sf2)":"var(--sf3)",color:rMonth===m?"var(--cy)":hasData?"var(--tx2)":"var(--tx3)",fontSize:10,cursor:hasData?"pointer":"not-allowed",fontFamily:"var(--mo)",fontWeight:rMonth===m?700:400}}>{m}월</button>;
                })}
              </div>
            </div>
            {(()=>{
              const key=`${rYear}-${String(rMonth).padStart(2,"0")}`;
              const d=REPORT_DATA[key];
              if(!d)return <div style={{textAlign:"center",fontSize:11,color:"var(--tx3)",padding:"8px"}}>해당 기간 데이터가 없습니다</div>;
              return <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
                  {[["구독자",d.subs+"명","var(--cy)"],["수익","₩"+(d.revenue/10000).toFixed(0)+"만","var(--gn)"],["대화",d.convos.toLocaleString()+"회","var(--am)"],["신규","+"+d.newSubs,"var(--pu)"],["평점",d.rating+"★","var(--go)"],["이탈","-"+d.churn,"var(--rd)"]].map(([l,v,c])=>(
                    <div key={l} style={{padding:"7px 9px",background:"var(--sf2)",borderRadius:7,textAlign:"center"}}><div style={{fontSize:9,color:"var(--tx3)",fontFamily:"var(--mo)",marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:800,color:c}}>{v}</div></div>
                  ))}
                </div>
                <div style={{padding:"7px 10px",background:"var(--sf2)",borderRadius:7,fontSize:11,color:"var(--tx2)",marginBottom:10}}><span style={{color:"var(--tx3)"}}>TOP 질문:</span> {d.topQ}</div>
              </>;
            })()}
          </Cd>
          <Cd style={{padding:"13px 15px"}}>
            <div style={{fontSize:11,fontWeight:700,marginBottom:8}}>📥 다운로드</div>
            {[{n:`${rYear}년 ${rMonth}월 종합 리포트`,f:"PDF"},{n:"질문 데이터",f:"CSV"},{n:"구독자 인구통계",f:"CSV"},{n:"피드백 목록",f:"CSV"}].map((r,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 9px",background:"var(--sf2)",borderRadius:7,marginBottom:5}}>
                <span style={{fontSize:13,flexShrink:0}}>{r.f==="PDF"?"📄":"📊"}</span>
                <span style={{flex:1,fontSize:11,fontWeight:600}}>{r.n}</span>
                <span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontFamily:"var(--mo)",background:r.f==="PDF"?"rgba(255,79,109,0.1)":"var(--cyd)",color:r.f==="PDF"?"var(--rd)":"var(--cy)"}}>{r.f}</span>
                <Bt v="sf" sz="sm">받기</Bt>
              </div>
            ))}
          </Cd>



{/* ── 질문 분석 ── */}
          <div style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10}}>📊 질문 분석</div>
          <Cd style={{padding:"13px 15px",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,marginBottom:4}}>📈 주간 대화 트렌드</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:4,height:54,marginTop:8}}>
              {ANALYTICS.weekly.map((v,i)=>(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                  <div style={{width:"100%",background:i===6?"var(--cy)":"var(--sf3)",borderRadius:"2px 2px 0 0",height:`${(v/312)*46}px`}}/>
                  <span style={{fontSize:9,color:"var(--tx3)",fontFamily:"var(--mo)"}}>{["월","화","수","목","금","토","일"][i]}</span>
                </div>
              ))}
            </div>
          </Cd>
          <Cd style={{padding:"13px 15px",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,marginBottom:10}}>🎯 TOP 질문 & 전환율</div>
            {ANALYTICS.topQ.map((item,i)=>(
              <div key={i} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:11,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{color:"var(--cy)",fontFamily:"var(--mo)",fontSize:9,marginRight:6}}>0{i+1}</span>{item.q}</span>
                  <div style={{display:"flex",gap:7,flexShrink:0,marginLeft:7}}><span style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)"}}>{item.n}회</span><span style={{fontSize:10,fontWeight:700,fontFamily:"var(--mo)",color:item.cv/item.n>.5?"var(--gn)":item.cv/item.n>.3?"var(--am)":"var(--rd)"}}>{Math.round(item.cv/item.n*100)}%</span></div>
                </div>
                <Pb val={item.n} max={234} c="var(--cy)"/>
              </div>
            ))}
          </Cd>
          {/* ── 고급 설정 토글 (인사이트) ── */}
          <button type="button" onClick={()=>setShowAdvanced(v=>!v)}
            style={{width:"100%",padding:"9px",borderRadius:9,border:"1px solid var(--br)",background:"transparent",color:showAdvanced?"var(--cy)":"var(--tx2)",fontSize:12,cursor:"pointer",fontFamily:"var(--fn)",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:showAdvanced?14:0,transition:"all 0.2s"}}>
            <span style={{fontSize:14}}>{showAdvanced?"▲":"▼"}</span>
            {showAdvanced?"접기":"더 보기 — 대화 이력 · 인구통계"}
          </button>
          {showAdvanced&&<div style={{animation:"fu 0.25s ease"}}>
          <Cd style={{padding:"13px 15px",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,marginBottom:10}}>💬 대화 이력 <span style={{fontSize:10,color:"var(--tx3)",fontWeight:400}}>클릭해서 대화 내용 확인</span></div>
            {CONV_HISTORY.map(c=>(
              <div key={c.id} style={{marginBottom:5}}>
                <div onClick={()=>setExpandedConv(expandedConv===c.id?null:c.id)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"var(--sf2)",borderRadius:expandedConv===c.id?"8px 8px 0 0":8,border:"1px solid var(--br)",cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="var(--br2)"} onMouseLeave={e=>e.currentTarget.style.borderColor=expandedConv===c.id?"var(--br2)":"var(--br)"}>
                  <div style={{flex:1,minWidth:0}}><div style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)"}}>{c.demo}</div><div style={{fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1}}>{c.lastQ}</div></div>
                  <div style={{flexShrink:0,display:"flex",gap:5,alignItems:"center"}}>
                    <span style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)"}}>{c.date.split(" ")[0]}</span>
                    <span style={{fontSize:10,fontFamily:"var(--mo)",color:c.score>=4.5?"var(--gn)":c.score>=3.5?"var(--am)":"var(--rd)"}}>★{c.score}</span>
                    {c.converted&&<Tg label="전환" c="gn"/>}
                  </div>
                  <span style={{fontSize:9,color:"var(--tx3)",flexShrink:0}}>{expandedConv===c.id?"▲":"▼"}</span>
                </div>
                {expandedConv===c.id&&<div style={{padding:"10px 12px",background:"var(--sf3)",border:"1px solid var(--br)",borderTop:"none",borderRadius:"0 0 8px 8px",animation:"fu 0.2s ease"}}>
                  {c.preview.map((p,i)=><div key={i} style={{fontSize:11,padding:"4px 7px",background:p.startsWith("Q:")?"var(--cyd)":"var(--sf2)",borderRadius:5,marginBottom:3,color:p.startsWith("Q:")?"var(--cy)":"var(--tx2)",lineHeight:1.5}}>{p}</div>)}
                  <div style={{marginTop:6,display:"flex",gap:6}}>
                    <div style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"var(--sf2)"}}><span style={{color:"var(--tx3)"}}>구독자:</span> <span style={{color:"var(--cy)",fontFamily:"var(--mo)"}}>{c.user}</span></div>
                    <div style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:c.converted?"rgba(79,255,176,0.1)":"var(--sf2)",color:c.converted?"var(--gn)":"var(--tx3)"}}>{c.converted?"✓ 구독 전환":"미전환"}</div>
                  </div>
                </div>}
              </div>
            ))}
          </Cd>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:10}}>
            <Cd style={{padding:"12px 13px"}}><div style={{fontSize:11,fontWeight:700,marginBottom:8}}>연령대</div>{ANALYTICS.demo.age.map(([l,v])=>(<div key={l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:10,minWidth:30}}>{l}</span><div style={{flex:1,height:4,background:"var(--sf3)",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:v+"%",background:"var(--cy)",borderRadius:2}}/></div><span style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)",minWidth:22}}>{v}%</span></div>))}</Cd>
            <Cd style={{padding:"12px 13px"}}><div style={{fontSize:11,fontWeight:700,marginBottom:8}}>직군</div>{ANALYTICS.demo.job.map(([l,v])=>(<div key={l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:10,minWidth:38}}>{l}</span><div style={{flex:1,height:4,background:"var(--sf3)",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:v+"%",background:"var(--gn)",borderRadius:2}}/></div><span style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)",minWidth:22}}>{v}%</span></div>))}</Cd>
          </div>

          </div>}  {/* end showAdvanced insight */}

          
        </div>}

        {tab==="ops"&&<div style={{animation:"fu 0.3s ease"}}>

          {/* ── 첫 메시지 설계 (기본) ── */}
          <div style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10}}>👋 첫 메시지 설계</div>
          <Cd style={{padding:"14px 16px",marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:4}}>구독자가 대화를 시작하면 클론이 먼저 건네는 말</div>
            <div style={{fontSize:11,color:"var(--tx2)",marginBottom:10,lineHeight:1.6}}>
              빈 채팅창 대신 클론이 먼저 질문을 던져 첫 대화의 가치를 즉시 느끼게 합니다.
            </div>
            <div style={{marginBottom:10,padding:"10px 12px",background:"var(--sf2)",borderRadius:8,border:"1px solid var(--br)"}}>
              <div style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)",marginBottom:6}}>현재 설정된 첫 메시지 미리보기</div>
              <div style={{display:"flex",gap:8}}>
                <Av char={clone.av} color={clone.color} size={22}/>
                <div style={{flex:1,padding:"8px 11px",borderRadius:9,borderTopLeftRadius:3,background:"var(--sf)",border:"1px solid var(--br)",fontSize:12,lineHeight:1.6,color:"var(--tx2)",whiteSpace:"pre-wrap"}}>
                  {clone.welcomeMsg||`안녕하세요! ${clone.name}의 AI 클론입니다. 궁금한 점을 물어보세요!`}
                </div>
              </div>
            </div>
            <textarea
              defaultValue={clone.welcomeMsg||""}
              placeholder={`예: 저는 15년 B2B 영업으로 300억을 계약한 ${clone.name}의 AI 클론입니다.\n콜드콜, 협상, 클로징 중 지금 가장 어려운 게 뭔가요?`}
              style={{width:"100%",padding:"9px 11px",border:"1px solid var(--br2)",borderRadius:8,background:"var(--sf2)",color:"var(--tx)",fontSize:12,outline:"none",fontFamily:"var(--fn)",resize:"none",height:80,lineHeight:1.6,marginBottom:8}}
              onChange={e=>updateClone(()=>({welcomeMsg:e.target.value}))}
            />
            <div style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)",marginBottom:8}}>💡 팁: 자신의 경력을 한 줄로 소개하고, 가장 잘 답할 수 있는 질문 유형을 먼저 유도하세요.</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {["콜드콜, 협상, 클로징 중 뭐가 가장 어려우세요?","지금 가장 급한 마케팅 고민이 뭔가요?","어느 단원이 가장 헷갈리시나요?"].map((t,i)=>(
                <button type="button" key={i} onClick={()=>updateClone(()=>({welcomeMsg:(clone.welcomeMsg||"").slice(0,-0)+"\n"+t}))}
                  style={{padding:"3px 9px",borderRadius:5,border:"1px solid var(--br)",background:"var(--sf2)",color:"var(--tx2)",fontSize:10,cursor:"pointer",fontFamily:"var(--mo)"}}>
                  + {t.slice(0,16)}...
                </button>
              ))}
            </div>
          </Cd>

          {/* ── 공지 관리 (기본) ── */}
          <div style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10}}>📢 공지 관리</div>
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:10}}>
            {(clone.notices||[]).map((n,i)=>(
              <Cd key={i} style={{padding:"11px 13px",borderColor:n.type==="📌 중요"?"rgba(255,200,50,0.3)":n.type==="⚠️ 주의사항"?"rgba(255,79,109,0.2)":"var(--br)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:12,fontWeight:700}}>{n.title}</span>
                  <div style={{display:"flex",gap:5,alignItems:"center"}}>
                    {n.type&&n.type!=="일반"&&<Tg label={n.type} c={n.type==="📌 중요"?"go":n.type==="⚠️ 주의사항"?"rd":"cy"}/>}
                    <Tg label={n.date}/>
                    <button type="button" onClick={()=>updateClone(p=>({notices:(p.notices||[]).filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",color:"var(--tx3)",cursor:"pointer",fontSize:13,lineHeight:1}}>×</button>
                  </div>
                </div>
                <p style={{fontSize:11,color:"var(--tx2)",lineHeight:1.5}}>{n.body}</p>
              </Cd>
            ))}
          </div>
          <Cd style={{padding:"13px 15px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,marginBottom:8}}>새 공지</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
              {NOTICE_TYPES.map(t=>(
                <button type="button" key={t} onClick={()=>setNewNotice(p=>({...p,type:t}))} style={{padding:"4px 9px",borderRadius:6,border:`1px solid ${newNotice.type===t?"var(--cy)":"var(--br)"}`,background:newNotice.type===t?"var(--cyd)":"var(--sf2)",color:newNotice.type===t?"var(--cy)":"var(--tx2)",fontSize:10,cursor:"pointer",fontFamily:"var(--fn)",fontWeight:newNotice.type===t?700:400}}>{t}</button>
              ))}
            </div>
            <input value={newNotice.title} onChange={e=>setNewNotice(p=>({...p,title:e.target.value}))} placeholder="공지 제목" style={{width:"100%",padding:"7px 9px",border:"1px solid var(--br)",borderRadius:7,background:"var(--sf2)",color:"var(--tx)",fontSize:11,outline:"none",fontFamily:"var(--fn)",marginBottom:6}}/>
            <textarea value={newNotice.body} onChange={e=>setNewNotice(p=>({...p,body:e.target.value}))} placeholder="내용" style={{width:"100%",padding:"7px 9px",border:"1px solid var(--br)",borderRadius:7,background:"var(--sf2)",color:"var(--tx)",fontSize:11,outline:"none",fontFamily:"var(--fn)",resize:"none",height:60,lineHeight:1.5,marginBottom:6}}/>
            <div style={{display:"flex",justifyContent:"flex-end"}}><Bt v="pr" sz="sm" dis={!newNotice.title} on={()=>{updateClone(p=>({notices:[{date:new Date().toLocaleDateString("ko"),title:newNotice.title,body:newNotice.body,type:newNotice.type},...(p.notices||[])]}));setNewNotice({title:"",body:"",type:"일반"});}}>게시</Bt></div>
          </Cd>

          {/* ── 고급 설정 토글 (운영) ── */}
          <button type="button" onClick={()=>setShowAdvanced(v=>!v)}
            style={{width:"100%",padding:"9px",borderRadius:9,border:"1px solid var(--br)",background:"transparent",color:showAdvanced?"var(--cy)":"var(--tx2)",fontSize:12,cursor:"pointer",fontFamily:"var(--fn)",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:showAdvanced?16:0,transition:"all 0.2s"}}>
            <span style={{fontSize:14}}>{showAdvanced?"▲":"▼"}</span>
            {showAdvanced?"접기":"고급 설정 — 마케팅 링크"}
          </button>
          {showAdvanced&&<div style={{animation:"fu 0.25s ease"}}>
          <div style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10}}>🔗 마케팅 링크</div>
          <div style={{fontSize:11,color:"var(--tx2)",marginBottom:10,lineHeight:1.6}}>특정 주제가 나올 때 클론이 자연스럽게 강의를 언급합니다. <span style={{color:"var(--cy)"}}>직접 광고가 아닙니다.</span></div>
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:10}}>
            {(clone.mktLinks||[]).map((m,i)=>(
              <Cd key={i} style={{padding:"11px 13px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div><div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{m.product}</div><div style={{fontSize:11,color:"var(--tx2)"}}>주제: <span style={{color:"var(--cy)",fontFamily:"var(--mo)"}}>{m.topic}</span></div><div style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)",marginTop:1}}>{m.url} · {m.price}</div></div>
                  <button type="button" onClick={()=>updateClone(p=>({mktLinks:p.mktLinks.filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",color:"var(--tx3)",cursor:"pointer",fontSize:15,lineHeight:1}}>×</button>
                </div>
              </Cd>
            ))}
          </div>
          <Cd style={{padding:"13px 15px",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,marginBottom:9}}>+ 마케팅 링크 추가</div>
            {[["주제 키워드",newMkt.topic,v=>setNewMkt(p=>({...p,topic:v})),"콜드메일, 협상, 클로징..."],["상품명",newMkt.product,v=>setNewMkt(p=>({...p,product:v})),"B2B 영업 마스터 클래스"],["링크",newMkt.url,v=>setNewMkt(p=>({...p,url:v})),"fastcampus.kr/..."],["가격",newMkt.price,v=>setNewMkt(p=>({...p,price:v})),"₩189,000"]].map(([l,val,fn,ph])=>(
              <div key={l} style={{marginBottom:7}}><label style={{fontSize:10,color:"var(--tx3)",fontFamily:"var(--mo)",display:"block",marginBottom:3}}>{l}</label><input value={val} onChange={e=>fn(e.target.value)} placeholder={ph} style={{width:"100%",padding:"7px 9px",border:"1px solid var(--br)",borderRadius:7,background:"var(--sf2)",color:"var(--tx)",fontSize:11,outline:"none",fontFamily:"var(--fn)"}}/></div>
            ))}
            <Bt v="pr" sz="sm" dis={!newMkt.topic||!newMkt.product} on={()=>{updateClone(p=>({mktLinks:[...p.mktLinks,{...newMkt}]}));setNewMkt({topic:"",product:"",url:"",price:""});}}>링크 추가</Bt>
          </Cd>
          </div>}

        </div>}
      </div>
    </div>
  );
}

