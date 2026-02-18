(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,28826,e=>{"use strict";let t=(0,e.i(26777).default)("plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);e.s(["Plus",()=>t],28826)},45549,e=>{"use strict";let t=(0,e.i(26777).default)("square-pen",[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]]);e.s(["Edit",()=>t],45549)},47637,e=>{"use strict";let t,a;var r,s=e.i(85481);let o={data:""},i=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,n=/\/\*[^]*?\*\/|  +/g,l=/\n+/g,d=(e,t)=>{let a="",r="",s="";for(let o in e){let i=e[o];"@"==o[0]?"i"==o[1]?a=o+" "+i+";":r+="f"==o[1]?d(i,o):o+"{"+d(i,"k"==o[1]?"":t)+"}":"object"==typeof i?r+=d(i,t?t.replace(/([^,])+/g,e=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):o):null!=i&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),s+=d.p?d.p(o,i):o+":"+i+";")}return a+(t&&s?t+"{"+s+"}":s)+r},c={},m=e=>{if("object"==typeof e){let t="";for(let a in e)t+=a+m(e[a]);return t}return e};function u(e){let t,a,r=this||{},s=e.call?e(r.p):e;return((e,t,a,r,s)=>{var o;let u=m(e),p=c[u]||(c[u]=(e=>{let t=0,a=11;for(;t<e.length;)a=101*a+e.charCodeAt(t++)>>>0;return"go"+a})(u));if(!c[p]){let t=u!==e?e:(e=>{let t,a,r=[{}];for(;t=i.exec(e.replace(n,""));)t[4]?r.shift():t[3]?(a=t[3].replace(l," ").trim(),r.unshift(r[0][a]=r[0][a]||{})):r[0][t[1]]=t[2].replace(l," ").trim();return r[0]})(e);c[p]=d(s?{["@keyframes "+p]:t}:t,a?"":"."+p)}let f=a&&c.g?c.g:null;return a&&(c.g=c[p]),o=c[p],f?t.data=t.data.replace(f,o):-1===t.data.indexOf(o)&&(t.data=r?o+t.data:t.data+o),p})(s.unshift?s.raw?(t=[].slice.call(arguments,1),a=r.p,s.reduce((e,r,s)=>{let o=t[s];if(o&&o.call){let e=o(a),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;o=t?"."+t:e&&"object"==typeof e?e.props?"":d(e,""):!1===e?"":e}return e+r+(null==o?"":o)},"")):s.reduce((e,t)=>Object.assign(e,t&&t.call?t(r.p):t),{}):s,(e=>{if("object"==typeof window){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||o})(r.target),r.g,r.o,r.k)}u.bind({g:1});let p,f,h,g=u.bind({k:1});function x(e,t){let a=this||{};return function(){let r=arguments;function s(o,i){let n=Object.assign({},o),l=n.className||s.className;a.p=Object.assign({theme:f&&f()},n),a.o=/ *go\d+/.test(l),n.className=u.apply(a,r)+(l?" "+l:""),t&&(n.ref=i);let d=e;return e[0]&&(d=n.as||e,delete n.as),h&&d[0]&&h(n),p(d,n)}return t?t(s):s}}var y=(e,t)=>"function"==typeof e?e(t):e,b=(t=0,()=>(++t).toString()),v="default",j=(e,t)=>{let{toastLimit:a}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,a)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:r}=t;return j(e,{type:+!!e.toasts.find(e=>e.id===r.id),toast:r});case 3:let{toastId:s}=t;return{...e,toasts:e.toasts.map(e=>e.id===s||void 0===s?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let o=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+o}))}}},w=[],N={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},_={},k=(e,t=v)=>{_[t]=j(_[t]||N,e),w.forEach(([e,a])=>{e===t&&a(_[t])})},z=e=>Object.keys(_).forEach(t=>k(e,t)),$=(e=v)=>t=>{k(t,e)},E=e=>(t,a)=>{let r,s=((e,t="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(null==a?void 0:a.id)||b()}))(t,e,a);return $(s.toasterId||(r=s.id,Object.keys(_).find(e=>_[e].toasts.some(e=>e.id===r))))({type:2,toast:s}),s.id},A=(e,t)=>E("blank")(e,t);A.error=E("error"),A.success=E("success"),A.loading=E("loading"),A.custom=E("custom"),A.dismiss=(e,t)=>{let a={type:3,toastId:e};t?$(t)(a):z(a)},A.dismissAll=e=>A.dismiss(void 0,e),A.remove=(e,t)=>{let a={type:4,toastId:e};t?$(t)(a):z(a)},A.removeAll=e=>A.remove(void 0,e),A.promise=(e,t,a)=>{let r=A.loading(t.loading,{...a,...null==a?void 0:a.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let s=t.success?y(t.success,e):void 0;return s?A.success(s,{id:r,...a,...null==a?void 0:a.success}):A.dismiss(r),e}).catch(e=>{let s=t.error?y(t.error,e):void 0;s?A.error(s,{id:r,...a,...null==a?void 0:a.error}):A.dismiss(r)}),e};var C=g`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,M=g`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,O=g`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,S=x("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${C} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${M} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${O} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,D=g`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,F=x("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${D} 1s linear infinite;
`,Z=g`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,I=g`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,L=x("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Z} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${I} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,P=x("div")`
  position: absolute;
`,T=x("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,q=g`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,H=x("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${q} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,U=({toast:e})=>{let{icon:t,type:a,iconTheme:r}=e;return void 0!==t?"string"==typeof t?s.createElement(H,null,t):t:"blank"===a?null:s.createElement(T,null,s.createElement(F,{...r}),"loading"!==a&&s.createElement(P,null,"error"===a?s.createElement(S,{...r}):s.createElement(L,{...r})))},B=x("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,K=x("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`;s.memo(({toast:e,position:t,style:r,children:o})=>{let i=e.height?((e,t)=>{let r=e.includes("top")?1:-1,[s,o]=(()=>{if(void 0===a&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");a=!e||e.matches}return a})()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[`
0% {transform: translate3d(0,${-200*r}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*r}%,-1px) scale(.6); opacity:0;}
`];return{animation:t?`${g(s)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${g(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(e.position||t||"top-center",e.visible):{opacity:0},n=s.createElement(U,{toast:e}),l=s.createElement(K,{...e.ariaProps},y(e.message,e));return s.createElement(B,{className:e.className,style:{...i,...r,...e.style}},"function"==typeof o?o({icon:n,message:l}):s.createElement(s.Fragment,null,n,l))}),r=s.createElement,d.p=void 0,p=r,f=void 0,h=void 0,u`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,e.s(["default",()=>A],47637)},73626,e=>{"use strict";var t=e.i(63113),a=e.i(85481),r=e.i(28826),s=e.i(45549);let o=(0,e.i(26777).default)("trash-2",[["path",{d:"M10 11v6",key:"nco0om"}],["path",{d:"M14 11v6",key:"outv1u"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]]);var i=e.i(36385),n=e.i(47637);function l(){let[e,l]=(0,a.useState)([]),[d,c]=(0,a.useState)(!0),[m,u]=(0,a.useState)(!1),[p,f]=(0,a.useState)(null),[h,g]=(0,a.useState)({name:"",delivery_fee:"",min_order_amount:""}),x=async()=>{try{c(!0);let e=await i.default.get("/admin/zones");e.data.success&&l(e.data.data)}catch(e){n.default.error("Failed to load zones")}finally{c(!1)}};(0,a.useEffect)(()=>{x()},[]);let y=async e=>{e.preventDefault();try{p?(await i.default.put(`/admin/zones/${p.id}`,h),n.default.success("Zone updated")):(await i.default.post("/admin/zones",h),n.default.success("Zone created")),u(!1),f(null),g({name:"",delivery_fee:"",min_order_amount:""}),x()}catch(e){n.default.error(e.response?.data?.message||"Operation failed")}},b=async e=>{if(confirm("Are you sure you want to delete this zone?"))try{await i.default.delete(`/admin/zones/${e}`),n.default.success("Zone deleted"),x()}catch(e){n.default.error("Failed to delete zone")}};return(0,t.jsxs)("div",{className:"space-y-6",children:[(0,t.jsxs)("div",{className:"flex justify-between items-center",children:[(0,t.jsx)("h1",{className:"text-2xl font-bold text-gray-900",children:"Delivery Zones"}),(0,t.jsxs)("button",{onClick:()=>{f(null),g({name:"",delivery_fee:"",min_order_amount:""}),u(!0)},className:"bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2",children:[(0,t.jsx)(r.Plus,{size:20})," Add Zone"]})]}),d?(0,t.jsx)("div",{children:"Loading..."}):(0,t.jsx)("div",{className:"bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden",children:(0,t.jsxs)("table",{className:"w-full text-left",children:[(0,t.jsx)("thead",{className:"bg-gray-50 border-b border-gray-100",children:(0,t.jsxs)("tr",{children:[(0,t.jsx)("th",{className:"p-4 font-bold text-gray-700",children:"Location Name"}),(0,t.jsx)("th",{className:"p-4 font-bold text-gray-700",children:"Delivery Fee"}),(0,t.jsx)("th",{className:"p-4 font-bold text-gray-700",children:"Min Order"}),(0,t.jsx)("th",{className:"p-4 font-bold text-gray-700",children:"Status"}),(0,t.jsx)("th",{className:"p-4 font-bold text-gray-700 text-right",children:"Actions"})]})}),(0,t.jsxs)("tbody",{className:"divide-y divide-gray-100",children:[e.map(e=>(0,t.jsxs)("tr",{className:"hover:bg-gray-50",children:[(0,t.jsx)("td",{className:"p-4 font-medium text-gray-900",children:e.name}),(0,t.jsxs)("td",{className:"p-4 text-green-600 font-bold",children:["₹",e.delivery_fee]}),(0,t.jsxs)("td",{className:"p-4 text-gray-500",children:["₹",e.min_order_amount]}),(0,t.jsx)("td",{className:"p-4",children:(0,t.jsx)("span",{className:`px-2 py-1 rounded-full text-xs font-bold ${e.is_active?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`,children:e.is_active?"Active":"Inactive"})}),(0,t.jsx)("td",{className:"p-4 text-right",children:(0,t.jsxs)("div",{className:"flex justify-end gap-2",children:[(0,t.jsx)("button",{onClick:()=>{f(e),g({name:e.name,delivery_fee:e.delivery_fee,min_order_amount:e.min_order_amount}),u(!0)},className:"p-2 text-blue-600 hover:bg-blue-50 rounded-lg",children:(0,t.jsx)(s.Edit,{size:18})}),(0,t.jsx)("button",{onClick:()=>b(e.id),className:"p-2 text-red-600 hover:bg-red-50 rounded-lg",children:(0,t.jsx)(o,{size:18})})]})})]},e.id)),0===e.length&&(0,t.jsx)("tr",{children:(0,t.jsx)("td",{colSpan:"5",className:"p-8 text-center text-gray-400",children:"No zones found. Add one to get started."})})]})]})}),m&&(0,t.jsx)("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",children:(0,t.jsxs)("div",{className:"bg-white rounded-2xl w-full max-w-md p-6",children:[(0,t.jsx)("h2",{className:"text-xl font-bold mb-4",children:p?"Edit Zone":"Add New Zone"}),(0,t.jsxs)("form",{onSubmit:y,className:"space-y-4",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Location Name"}),(0,t.jsx)("input",{type:"text",required:!0,placeholder:"e.g. Degloor, Madnoor",className:"w-full p-2 border border-gray-200 rounded-lg",value:h.name,onChange:e=>g({...h,name:e.target.value})})]}),(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Delivery Fee (₹)"}),(0,t.jsx)("input",{type:"number",required:!0,min:"0",className:"w-full p-2 border border-gray-200 rounded-lg",value:h.delivery_fee,onChange:e=>g({...h,delivery_fee:e.target.value})})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Min Order (₹)"}),(0,t.jsx)("input",{type:"number",min:"0",className:"w-full p-2 border border-gray-200 rounded-lg",value:h.min_order_amount,onChange:e=>g({...h,min_order_amount:e.target.value})})]})]}),(0,t.jsxs)("div",{className:"flex justify-end gap-3 mt-6",children:[(0,t.jsx)("button",{type:"button",onClick:()=>u(!1),className:"px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg",children:"Cancel"}),(0,t.jsx)("button",{type:"submit",className:"px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-orange-700",children:p?"Update":"Create"})]})]})]})})]})}e.s(["default",()=>l],73626)}]);