import Swal from 'sweetalert2';

/**
 * SweetAlert2 utility with dark theme for notaris system
 * Consistent with the app's slate/emerald color scheme
 */

const darkTheme = {
  background: '#0f172a', // slate-900
  color: '#e2e8f0', // slate-200
  confirmButtonColor: '#059669', // emerald-600
  cancelButtonColor: '#475569', // slate-600
  denyButtonColor: '#dc2626', // red-600
};

// ==================== SUCCESS ====================

export function showSuccess(title: string, text?: string) {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: false,
    ...darkTheme,
  });
}

export function showAISuccess(action: string, detail?: string) {
  return Swal.fire({
    icon: 'success',
    title: `✅ ${action} Berhasil!`,
    html: detail ? `<p style="color: #94a3b8; font-size: 14px;">${detail}</p>` : undefined,
    timer: 4000,
    timerProgressBar: true,
    showConfirmButton: true,
    confirmButtonText: 'OK',
    ...darkTheme,
  });
}

// ==================== ERROR ====================

export function showError(title: string, text?: string) {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'OK',
    ...darkTheme,
  });
}

export function showAIError(action: string, errorMsg?: string) {
  return Swal.fire({
    icon: 'error',
    title: `❌ ${action} Gagal`,
    html: errorMsg
      ? `<p style="color: #f87171; font-size: 14px;">${errorMsg}</p>`
      : '<p style="color: #94a3b8;">Terjadi kesalahan saat memproses AI. Silakan coba lagi.</p>',
    confirmButtonText: 'OK',
    ...darkTheme,
  });
}

// ==================== CONFIRM ====================

export async function showConfirm(
  title: string,
  text: string,
  confirmText = 'Ya',
  cancelText = 'Batal'
): Promise<boolean> {
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    ...darkTheme,
  });
  return result.isConfirmed;
}

export async function showDeleteConfirm(itemName: string): Promise<boolean> {
  const result = await Swal.fire({
    icon: 'warning',
    title: 'Hapus Data?',
    html: `<p style="color: #94a3b8;">Anda yakin ingin menghapus <strong style="color: #f87171;">${itemName}</strong>?<br/>Tindakan ini tidak dapat dibatalkan.</p>`,
    showCancelButton: true,
    confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    ...darkTheme,
    confirmButtonColor: '#dc2626',
  });
  return result.isConfirmed;
}

// ==================== AI PROGRESS ====================

let progressSwal: typeof Swal | null = null;

export function showAIProgress(action: string) {
  const startTime = Date.now();

  Swal.fire({
    title: `🤖 AI sedang memproses...`,
    html: `
      <div style="text-align: center;">
        <p style="color: #a78bfa; font-weight: 600; margin-bottom: 8px; font-size: 15px;">${action}</p>
        <div style="display: flex; justify-content: center; gap: 6px; margin: 16px 0;">
          <span style="width: 10px; height: 10px; background: #059669; border-radius: 50%; animation: bounce 1s infinite;"></span>
          <span style="width: 10px; height: 10px; background: #059669; border-radius: 50%; animation: bounce 1s infinite 0.15s;"></span>
          <span style="width: 10px; height: 10px; background: #059669; border-radius: 50%; animation: bounce 1s infinite 0.3s;"></span>
        </div>
        <p id="swal-elapsed" style="color: #64748b; font-size: 13px;">Waktu: 0 detik</p>
        <p style="color: #475569; font-size: 12px; margin-top: 8px;">Mohon tunggu, jangan tutup halaman ini</p>
      </div>
      <style>
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-12px); }
        }
      </style>
    `,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    showCancelButton: false,
    ...darkTheme,
    didOpen: () => {
      const elapsedEl = document.getElementById('swal-elapsed');
      if (elapsedEl) {
        const timer = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          elapsedEl.textContent = `Waktu: ${elapsed} detik`;
        }, 1000);
        // Store timer for cleanup
        (Swal as any).__progressTimer = timer;
      }
    },
  });

  progressSwal = Swal;
}

export function closeAIProgress() {
  if ((Swal as any).__progressTimer) {
    clearInterval((Swal as any).__progressTimer);
    (Swal as any).__progressTimer = null;
  }
  Swal.close();
  progressSwal = null;
}

// ==================== INFO ====================

export function showInfo(title: string, text?: string) {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonText: 'OK',
    ...darkTheme,
  });
}

export default Swal;
