module.exports=[24361,(a,b,c)=>{b.exports=a.x("util",()=>require("util"))},14747,(a,b,c)=>{b.exports=a.x("path",()=>require("path"))},48160,a=>{"use strict";let b=(0,a.i(24069).default)("plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);a.s(["Plus",()=>b],48160)},87680,a=>{"use strict";let b=(0,a.i(24069).default)("square-pen",[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]]);a.s(["Edit",()=>b],87680)},26040,a=>{"use strict";let b,c;var d,e=a.i(58866);let f={data:""},g=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,h=/\/\*[^]*?\*\/|  +/g,i=/\n+/g,j=(a,b)=>{let c="",d="",e="";for(let f in a){let g=a[f];"@"==f[0]?"i"==f[1]?c=f+" "+g+";":d+="f"==f[1]?j(g,f):f+"{"+j(g,"k"==f[1]?"":b)+"}":"object"==typeof g?d+=j(g,b?b.replace(/([^,])+/g,a=>f.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,b=>/&/.test(b)?b.replace(/&/g,a):a?a+" "+b:b)):f):null!=g&&(f=/^--/.test(f)?f:f.replace(/[A-Z]/g,"-$&").toLowerCase(),e+=j.p?j.p(f,g):f+":"+g+";")}return c+(b&&e?b+"{"+e+"}":e)+d},k={},l=a=>{if("object"==typeof a){let b="";for(let c in a)b+=c+l(a[c]);return b}return a};function m(a){let b,c,d=this||{},e=a.call?a(d.p):a;return((a,b,c,d,e)=>{var f;let m=l(a),n=k[m]||(k[m]=(a=>{let b=0,c=11;for(;b<a.length;)c=101*c+a.charCodeAt(b++)>>>0;return"go"+c})(m));if(!k[n]){let b=m!==a?a:(a=>{let b,c,d=[{}];for(;b=g.exec(a.replace(h,""));)b[4]?d.shift():b[3]?(c=b[3].replace(i," ").trim(),d.unshift(d[0][c]=d[0][c]||{})):d[0][b[1]]=b[2].replace(i," ").trim();return d[0]})(a);k[n]=j(e?{["@keyframes "+n]:b}:b,c?"":"."+n)}let o=c&&k.g?k.g:null;return c&&(k.g=k[n]),f=k[n],o?b.data=b.data.replace(o,f):-1===b.data.indexOf(f)&&(b.data=d?f+b.data:b.data+f),n})(e.unshift?e.raw?(b=[].slice.call(arguments,1),c=d.p,e.reduce((a,d,e)=>{let f=b[e];if(f&&f.call){let a=f(c),b=a&&a.props&&a.props.className||/^go/.test(a)&&a;f=b?"."+b:a&&"object"==typeof a?a.props?"":j(a,""):!1===a?"":a}return a+d+(null==f?"":f)},"")):e.reduce((a,b)=>Object.assign(a,b&&b.call?b(d.p):b),{}):e,d.target||f,d.g,d.o,d.k)}m.bind({g:1});let n,o,p,q=m.bind({k:1});function r(a,b){let c=this||{};return function(){let d=arguments;function e(f,g){let h=Object.assign({},f),i=h.className||e.className;c.p=Object.assign({theme:o&&o()},h),c.o=/ *go\d+/.test(i),h.className=m.apply(c,d)+(i?" "+i:""),b&&(h.ref=g);let j=a;return a[0]&&(j=h.as||a,delete h.as),p&&j[0]&&p(h),n(j,h)}return b?b(e):e}}var s=(a,b)=>"function"==typeof a?a(b):a,t=(b=0,()=>(++b).toString()),u="default",v=(a,b)=>{let{toastLimit:c}=a.settings;switch(b.type){case 0:return{...a,toasts:[b.toast,...a.toasts].slice(0,c)};case 1:return{...a,toasts:a.toasts.map(a=>a.id===b.toast.id?{...a,...b.toast}:a)};case 2:let{toast:d}=b;return v(a,{type:+!!a.toasts.find(a=>a.id===d.id),toast:d});case 3:let{toastId:e}=b;return{...a,toasts:a.toasts.map(a=>a.id===e||void 0===e?{...a,dismissed:!0,visible:!1}:a)};case 4:return void 0===b.toastId?{...a,toasts:[]}:{...a,toasts:a.toasts.filter(a=>a.id!==b.toastId)};case 5:return{...a,pausedAt:b.time};case 6:let f=b.time-(a.pausedAt||0);return{...a,pausedAt:void 0,toasts:a.toasts.map(a=>({...a,pauseDuration:a.pauseDuration+f}))}}},w=[],x={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},y={},z=(a,b=u)=>{y[b]=v(y[b]||x,a),w.forEach(([a,c])=>{a===b&&c(y[b])})},A=a=>Object.keys(y).forEach(b=>z(a,b)),B=(a=u)=>b=>{z(b,a)},C=a=>(b,c)=>{let d,e=((a,b="blank",c)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:b,ariaProps:{role:"status","aria-live":"polite"},message:a,pauseDuration:0,...c,id:(null==c?void 0:c.id)||t()}))(b,a,c);return B(e.toasterId||(d=e.id,Object.keys(y).find(a=>y[a].toasts.some(a=>a.id===d))))({type:2,toast:e}),e.id},D=(a,b)=>C("blank")(a,b);D.error=C("error"),D.success=C("success"),D.loading=C("loading"),D.custom=C("custom"),D.dismiss=(a,b)=>{let c={type:3,toastId:a};b?B(b)(c):A(c)},D.dismissAll=a=>D.dismiss(void 0,a),D.remove=(a,b)=>{let c={type:4,toastId:a};b?B(b)(c):A(c)},D.removeAll=a=>D.remove(void 0,a),D.promise=(a,b,c)=>{let d=D.loading(b.loading,{...c,...null==c?void 0:c.loading});return"function"==typeof a&&(a=a()),a.then(a=>{let e=b.success?s(b.success,a):void 0;return e?D.success(e,{id:d,...c,...null==c?void 0:c.success}):D.dismiss(d),a}).catch(a=>{let e=b.error?s(b.error,a):void 0;e?D.error(e,{id:d,...c,...null==c?void 0:c.error}):D.dismiss(d)}),a};var E=q`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,F=q`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,G=q`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,H=r("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${a=>a.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${E} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${F} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${a=>a.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${G} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,I=q`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,J=r("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${a=>a.secondary||"#e0e0e0"};
  border-right-color: ${a=>a.primary||"#616161"};
  animation: ${I} 1s linear infinite;
`,K=q`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,L=q`
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
}`,M=r("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${a=>a.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${K} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${L} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${a=>a.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,N=r("div")`
  position: absolute;
`,O=r("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,P=q`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Q=r("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${P} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,R=({toast:a})=>{let{icon:b,type:c,iconTheme:d}=a;return void 0!==b?"string"==typeof b?e.createElement(Q,null,b):b:"blank"===c?null:e.createElement(O,null,e.createElement(J,{...d}),"loading"!==c&&e.createElement(N,null,"error"===c?e.createElement(H,{...d}):e.createElement(M,{...d})))},S=r("div")`
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
`,T=r("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`;e.memo(({toast:a,position:b,style:d,children:f})=>{let g=a.height?((a,b)=>{let d=a.includes("top")?1:-1,[e,f]=c?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[`
0% {transform: translate3d(0,${-200*d}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*d}%,-1px) scale(.6); opacity:0;}
`];return{animation:b?`${q(e)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${q(f)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(a.position||b||"top-center",a.visible):{opacity:0},h=e.createElement(R,{toast:a}),i=e.createElement(T,{...a.ariaProps},s(a.message,a));return e.createElement(S,{className:a.className,style:{...g,...d,...a.style}},"function"==typeof f?f({icon:h,message:i}):e.createElement(e.Fragment,null,h,i))}),d=e.createElement,j.p=void 0,n=d,o=void 0,p=void 0,m`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,a.s(["default",()=>D],26040)},90533,a=>{"use strict";var b=a.i(97119),c=a.i(58866),d=a.i(48160),e=a.i(87680);let f=(0,a.i(24069).default)("trash-2",[["path",{d:"M10 11v6",key:"nco0om"}],["path",{d:"M14 11v6",key:"outv1u"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]]);var g=a.i(96417),h=a.i(26040);function i(){let[a,i]=(0,c.useState)([]),[j,k]=(0,c.useState)(!0),[l,m]=(0,c.useState)(!1),[n,o]=(0,c.useState)(null),[p,q]=(0,c.useState)({name:"",delivery_fee:"",min_order_amount:""}),r=async()=>{try{k(!0);let a=await g.default.get("/admin/zones");a.data.success&&i(a.data.data)}catch(a){h.default.error("Failed to load zones")}finally{k(!1)}};(0,c.useEffect)(()=>{r()},[]);let s=async a=>{a.preventDefault();try{n?(await g.default.put(`/admin/zones/${n.id}`,p),h.default.success("Zone updated")):(await g.default.post("/admin/zones",p),h.default.success("Zone created")),m(!1),o(null),q({name:"",delivery_fee:"",min_order_amount:""}),r()}catch(a){h.default.error(a.response?.data?.message||"Operation failed")}},t=async a=>{if(confirm("Are you sure you want to delete this zone?"))try{await g.default.delete(`/admin/zones/${a}`),h.default.success("Zone deleted"),r()}catch(a){h.default.error("Failed to delete zone")}};return(0,b.jsxs)("div",{className:"space-y-6",children:[(0,b.jsxs)("div",{className:"flex justify-between items-center",children:[(0,b.jsx)("h1",{className:"text-2xl font-bold text-gray-900",children:"Delivery Zones"}),(0,b.jsxs)("button",{onClick:()=>{o(null),q({name:"",delivery_fee:"",min_order_amount:""}),m(!0)},className:"bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2",children:[(0,b.jsx)(d.Plus,{size:20})," Add Zone"]})]}),j?(0,b.jsx)("div",{children:"Loading..."}):(0,b.jsx)("div",{className:"bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden",children:(0,b.jsxs)("table",{className:"w-full text-left",children:[(0,b.jsx)("thead",{className:"bg-gray-50 border-b border-gray-100",children:(0,b.jsxs)("tr",{children:[(0,b.jsx)("th",{className:"p-4 font-bold text-gray-700",children:"Location Name"}),(0,b.jsx)("th",{className:"p-4 font-bold text-gray-700",children:"Delivery Fee"}),(0,b.jsx)("th",{className:"p-4 font-bold text-gray-700",children:"Min Order"}),(0,b.jsx)("th",{className:"p-4 font-bold text-gray-700",children:"Status"}),(0,b.jsx)("th",{className:"p-4 font-bold text-gray-700 text-right",children:"Actions"})]})}),(0,b.jsxs)("tbody",{className:"divide-y divide-gray-100",children:[a.map(a=>(0,b.jsxs)("tr",{className:"hover:bg-gray-50",children:[(0,b.jsx)("td",{className:"p-4 font-medium text-gray-900",children:a.name}),(0,b.jsxs)("td",{className:"p-4 text-green-600 font-bold",children:["₹",a.delivery_fee]}),(0,b.jsxs)("td",{className:"p-4 text-gray-500",children:["₹",a.min_order_amount]}),(0,b.jsx)("td",{className:"p-4",children:(0,b.jsx)("span",{className:`px-2 py-1 rounded-full text-xs font-bold ${a.is_active?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`,children:a.is_active?"Active":"Inactive"})}),(0,b.jsx)("td",{className:"p-4 text-right",children:(0,b.jsxs)("div",{className:"flex justify-end gap-2",children:[(0,b.jsx)("button",{onClick:()=>{o(a),q({name:a.name,delivery_fee:a.delivery_fee,min_order_amount:a.min_order_amount}),m(!0)},className:"p-2 text-blue-600 hover:bg-blue-50 rounded-lg",children:(0,b.jsx)(e.Edit,{size:18})}),(0,b.jsx)("button",{onClick:()=>t(a.id),className:"p-2 text-red-600 hover:bg-red-50 rounded-lg",children:(0,b.jsx)(f,{size:18})})]})})]},a.id)),0===a.length&&(0,b.jsx)("tr",{children:(0,b.jsx)("td",{colSpan:"5",className:"p-8 text-center text-gray-400",children:"No zones found. Add one to get started."})})]})]})}),l&&(0,b.jsx)("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",children:(0,b.jsxs)("div",{className:"bg-white rounded-2xl w-full max-w-md p-6",children:[(0,b.jsx)("h2",{className:"text-xl font-bold mb-4",children:n?"Edit Zone":"Add New Zone"}),(0,b.jsxs)("form",{onSubmit:s,className:"space-y-4",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Location Name"}),(0,b.jsx)("input",{type:"text",required:!0,placeholder:"e.g. Degloor, Madnoor",className:"w-full p-2 border border-gray-200 rounded-lg",value:p.name,onChange:a=>q({...p,name:a.target.value})})]}),(0,b.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Delivery Fee (₹)"}),(0,b.jsx)("input",{type:"number",required:!0,min:"0",className:"w-full p-2 border border-gray-200 rounded-lg",value:p.delivery_fee,onChange:a=>q({...p,delivery_fee:a.target.value})})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Min Order (₹)"}),(0,b.jsx)("input",{type:"number",min:"0",className:"w-full p-2 border border-gray-200 rounded-lg",value:p.min_order_amount,onChange:a=>q({...p,min_order_amount:a.target.value})})]})]}),(0,b.jsxs)("div",{className:"flex justify-end gap-3 mt-6",children:[(0,b.jsx)("button",{type:"button",onClick:()=>m(!1),className:"px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg",children:"Cancel"}),(0,b.jsx)("button",{type:"submit",className:"px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-orange-700",children:n?"Update":"Create"})]})]})]})})]})}a.s(["default",()=>i],90533)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__218e2f77._.js.map