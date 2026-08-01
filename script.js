// ===== CONFIG =====
const WA_NUMBER = "6285846219560"; // Ganti dengan nomor WhatsApp admin

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 20);
});

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

hamburger.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  document.body.style.overflow = isOpen ? "hidden" : "";
  hamburger.querySelector("i").className = isOpen
    ? "fas fa-times"
    : "fas fa-bars";
});

navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    document.body.style.overflow = "";
    hamburger.querySelector("i").className = "fas fa-bars";
  });
});

// ===== FADE-IN ON SCROLL =====
const observer = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
  { threshold: 0.12 }
);
document.querySelectorAll(".fade-in").forEach(el => observer.observe(el));

// ===== FAQ ACCORDION =====
document.querySelectorAll(".faq-question").forEach(btn => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const isOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item.open").forEach(i => i.classList.remove("open"));
    if (!isOpen) item.classList.add("open");
  });
});

// ===== FILE UPLOAD LABEL =====
const fileInput = document.getElementById("file");
const fileName = document.getElementById("fileName");

fileInput.addEventListener("change", () => {
  fileName.textContent = fileInput.files[0]?.name || "Klik atau drag file ke sini";
});

// ===== FORM VALIDATION & WHATSAPP =====
document.getElementById("orderForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const nama = document.getElementById("nama").value.trim();
  const wa = document.getElementById("wa").value.trim();
  const layanan = document.getElementById("selectLayanan").value.trim();
  const judul = document.getElementById("judul").value.trim();
  const deadline = document.getElementById("deadline").value;
  const deskripsi = document.getElementById("deskripsi").value.trim();
  const file = fileInput.files[0];

  // Validasi
  const fields = [
    { val: nama, label: "Nama Lengkap" },
    { val: wa, label: "Nomor WhatsApp" },
    { val: layanan, label: "Jenis Layanan" },
    { val: judul, label: "Judul Tugas" },
    { val: deadline, label: "Deadline" },
    { val: deskripsi, label: "Deskripsi Tugas" },
  ];

  for (const f of fields) {
    if (!f.val) {
      showToast(`⚠️ Mohon isi field: ${f.label}`, "error");
      return;
    }
  }

  // Format tanggal
  const deadlineFormatted = new Date(deadline).toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const submitBtn = this.querySelector(".btn-submit");
  const originalBtnText = submitBtn.innerHTML;

  let fileLink = "";
  let uploadFailed = false;

  if (file) {
    // Batas ukuran file (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast("⚠️ Ukuran file maksimal 10MB!", "error");
      return;
    }

    // Disable button & loading feedback
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Mengunggah File...`;
    showToast("⏳ Sedang mengunggah file lampiran ke cloud...", "info");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("https://tmpfiles.org/api/v1/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("Upload failed");

      const json = await response.json();
      if (json.status === "success" && json.data && json.data.url) {
        // Direct download link format
        fileLink = json.data.url.replace("https://tmpfiles.org/", "https://tmpfiles.org/dl/");
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      console.error("Gagal upload file:", err);
      uploadFailed = true;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }

  // Format pesan WhatsApp
  let fileText = "";
  if (file) {
    if (fileLink) {
      fileText = `Link File: ${fileLink}\n`;
    } else {
      fileText = `File Lampiran: ${file.name} (Gagal diunggah, silakan kirim manual)\n`;
    }
  }

  const message =
    `Halo, saya ingin memesan jasa.\n\n` +
    `Nama: ${nama}\n` +
    `Nomor WA: ${wa}\n` +
    `Layanan: ${layanan}\n` +
    `Judul Tugas: ${judul}\n` +
    `Deadline: ${deadlineFormatted}\n` +
    fileText + `\n` +
    `Deskripsi:\n${deskripsi}\n\n` +
    `Mohon informasi harga dan estimasi pengerjaan.`;

  const waURL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;

  // Salin detail pesanan ke clipboard
  let copySuccess = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message);
    }
    
    // Fallback copy secara synchronous menggunakan temporary textarea
    const textArea = document.createElement("textarea");
    textArea.value = message;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    copySuccess = true;
  } catch (err) {
    console.error("Gagal menyalin teks ke clipboard:", err);
  }

  // Tampilkan notifikasi toast
  if (uploadFailed) {
    showToast("⚠️ File gagal diunggah, silakan kirim file secara manual di WhatsApp.", "error");
  } else if (copySuccess) {
    showToast("✅ Detail pesanan disalin & WhatsApp sedang dibuka...", "success");
  } else {
    showToast("✅ Membuka WhatsApp...", "success");
  }

  // Buka URL WhatsApp
  const newWindow = window.open(waURL, "_blank");
  if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
    // Jika window.open diblokir popup blocker, gunakan redirect pada tab saat ini
    window.location.href = waURL;
  }

  this.reset();
  fileName.textContent = "Klik atau drag file ke sini";
});

// ===== TOAST NOTIFICATION =====
function showToast(msg, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 3700);
}

// ===== SET MIN DATE FOR DEADLINE =====
const deadlineInput = document.getElementById("deadline");
const today = new Date().toISOString().split("T")[0];
deadlineInput.setAttribute("min", today);
