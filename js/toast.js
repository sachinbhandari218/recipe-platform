export function showToast(message, type = "success", duration = 4000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "pointer-events-auto transform transition-all duration-300 ease-out translate-y-2 opacity-0 flex items-start p-4 rounded-xl shadow-xl border glass-card text-sm font-medium";

  let iconSvg = "";
  let borderClass = "";
  let bgIconClass = "";

  if (type === "success") {
    borderClass = "border-orange-200 bg-white/98 text-stone-900 shadow-orange-500/10";
    bgIconClass = "bg-orange-100 text-orange-600";
    iconSvg = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>`;
  } else if (type === "error") {
    borderClass = "border-rose-200 bg-white/95 text-rose-950 shadow-rose-500/10";
    bgIconClass = "bg-rose-100 text-rose-600";
    iconSvg = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>`;
  } else if (type === "warning") {
    borderClass = "border-amber-200 bg-white/95 text-amber-950 shadow-amber-500/10";
    bgIconClass = "bg-amber-100 text-amber-600";
    iconSvg = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
  } else {
    borderClass = "border-sky-200 bg-white/95 text-sky-950 shadow-sky-500/10";
    bgIconClass = "bg-sky-100 text-sky-600";
    iconSvg = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
  }

  toast.className += ` ${borderClass}`;
  toast.innerHTML = `
    <div class="flex-shrink-0 p-1 rounded-lg ${bgIconClass} mr-3">
      ${iconSvg}
    </div>
    <div class="flex-1 pt-0.5 leading-snug">
      ${message}
    </div>
    <button type="button" class="ml-3 text-slate-400 hover:text-slate-600 transition-colors p-1" onclick="this.parentElement.remove()">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
    toast.classList.add("translate-y-0", "opacity-100");
  });

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}
