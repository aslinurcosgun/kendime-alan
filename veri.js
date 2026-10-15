// Kendime Alan - kullanıcıya özel yerel önbellek ve kontrollü Supabase eşitlemesi.
// Bu dosya ve auth.js, script.js'den ÖNCE yüklenmelidir.

const veriAnahtarlari = [
    "kendimeAlanGorevler", "kendimeAlanHaftalikPlanlar",
    "kendimeAlanAylikPlanlar", "kendimeAlanHedefler",
    "kendimeAlanSaglik", "kendimeAlanBakimRutini",
    "kendimeAlanProfil", "kendimeAlanHesaplar",
    "kendimeAlanGelirKaynaklari", "kendimeAlanButceV2",
    "kendimeAlanButceHedefleri", "kendimeAlanIslemler",
    "kendimeAlanKiloOlcumleri", "kendimeAlanOzelGunler"
];
const kaAnahtarKumesi = new Set(veriAnahtarlari);
let kaKullaniciId = null;
let kaBulutSurumu = null;
let kaBulutSatiriVar = false;
let kaDegisiklikSayisi = 0;
let kaBekleyenKayit = false;
let kaKayitZamani = null;
let kaKayitCalisiyor = null;
let kaCakismaVar = false;
let kaSonHata = null;

function kaDurumGoster(metin, hata = false) {
    const alan = document.getElementById("ka-sync-durum");
    if (alan) {
        alan.textContent = metin;
        alan.style.color = hata ? "#9b234d" : "";
    }
    const uyari = document.getElementById("ka-sync-uyari");
    if (uyari) {
        uyari.textContent = hata ? metin : "";
        uyari.hidden = !hata;
    }
}

function kaOnEk(userId = kaKullaniciId) {
    if (!userId) throw new Error("Kullanıcı deposu henüz hazır değil.");
    return "kendimeAlanKullanici:" + userId + ":";
}

function kaMetaOku(userId) {
    const ham = localStorage.getItem(kaOnEk(userId) + "__syncMeta");
    if (!ham) return null;
    const meta = JSON.parse(ham);
    if (!meta || typeof meta !== "object" || typeof meta.dirty !== "boolean") {
        throw new Error("Eşitleme bilgisi geçersiz. Eski kayıtlarını koru.");
    }
    return meta;
}

function kaMetaKaydet() {
    localStorage.setItem(kaOnEk() + "__syncMeta", JSON.stringify({
        dirty: kaBekleyenKayit,
        version: kaBulutSurumu,
        hasRow: kaBulutSatiriVar
    }));
}

function kaYerelVeriler() {
    const sonuc = {};
    veriAnahtarlari.forEach(anahtar => {
        const ham = localStorage.getItem(kaOnEk() + anahtar);
        if (ham !== null) sonuc[anahtar] = JSON.parse(ham);
    });
    return sonuc;
}

const kaDepo = {
    getItem(anahtar) {
        if (!kaAnahtarKumesi.has(anahtar)) throw new Error("Tanınmayan kayıt: " + anahtar);
        return localStorage.getItem(kaOnEk() + anahtar);
    },
    setItem(anahtar, deger) {
        if (!kaAnahtarKumesi.has(anahtar)) throw new Error("Tanınmayan kayıt: " + anahtar);
        if (typeof deger !== "string") throw new Error("Kayıt metin biçiminde olmalı.");
        JSON.parse(deger);
        // Önce yerelde kalıcılaştır; ağ başarısız olsa da veri kaybolmasın.
        localStorage.setItem(kaOnEk() + anahtar, deger);
        kaKirliIsaretle();
    },
    removeItem(anahtar) {
        if (!kaAnahtarKumesi.has(anahtar)) throw new Error("Tanınmayan kayıt: " + anahtar);
        localStorage.removeItem(kaOnEk() + anahtar);
        kaKirliIsaretle();
    }
};

function kaKirliIsaretle() {
    kaDegisiklikSayisi++;
    kaBekleyenKayit = true;
    kaMetaKaydet();
    if (kaCakismaVar) {
        kaDurumGoster("Bulut kaydı başka cihazda değişmiş. Bu cihazdaki kayıtlar korundu; otomatik üzerine yazılmadı.", true);
        return;
    }
    kaDurumGoster("☁️ Değişiklikler eşitleniyor...");
    clearTimeout(kaKayitZamani);
    kaKayitZamani = setTimeout(() => { kaEsitle().catch(console.error); }, 900);
}

async function kaBulutuOku(userId) {
    const { data, error } = await supabaseClient
        .from("kullanici_verileri")
        .select("veriler, guncellenme_tarihi")
        .eq("user_id", userId)
        .maybeSingle();
    if (error) throw error;
    if (data && (!data.veriler || typeof data.veriler !== "object" || Array.isArray(data.veriler))) {
        throw new Error("Buluttaki kayıt yapısı geçersiz.");
    }
    if (data && Object.keys(data.veriler).some(k => !kaAnahtarKumesi.has(k))) {
        throw new Error("Bulutta tanınmayan kayıt alanları var.");
    }
    return data;
}

async function kaVeriyiBaslat(userId) {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error || !data.user || data.user.id !== userId) {
        throw new Error("Oturum doğrulanamadı.");
    }
    const bulut = await kaBulutuOku(userId);
    const eskiMeta = kaMetaOku(userId);
    kaKullaniciId = userId;
    kaBulutSurumu = bulut?.guncellenme_tarihi ?? null;
    kaBulutSatiriVar = !!bulut;

    if (eskiMeta?.dirty) {
        // Cihaz kapanmış / bağlantı kopmuş olabilir. Yerel değişiklikleri koru.
        kaBekleyenKayit = true;
        kaBulutSurumu = eskiMeta.version ?? null;
        kaBulutSatiriVar = !!eskiMeta.hasRow;
        if (kaBulutSurumu !== (bulut?.guncellenme_tarihi ?? null)
            || kaBulutSatiriVar !== !!bulut) {
            kaCakismaVar = true;
            kaDurumGoster("Bulutta farklı değişiklikler var. Yerel kayıtların korundu; otomatik eşitleme durduruldu.", true);
        } else {
            kaDurumGoster("☁️ Bekleyen kayıtlar eşitleniyor...");
            kaKayitZamani = setTimeout(() => { kaEsitle().catch(console.error); }, 1200);
        }
        return;
    }

    // Bulut temel kaynaktır; ortak eski localStorage anahtarlarına ASLA dokunma.
    for (const anahtar of veriAnahtarlari) {
        const kayit = bulut?.veriler?.[anahtar];
        if (Object.prototype.hasOwnProperty.call(bulut?.veriler || {}, anahtar)) {
            localStorage.setItem(kaOnEk() + anahtar, JSON.stringify(kayit));
        } else {
            localStorage.removeItem(kaOnEk() + anahtar);
        }
    }
    kaBekleyenKayit = false;
    kaCakismaVar = false;
    kaMetaKaydet();
    kaDurumGoster("☁️ Kayıtların güncel.");
}

async function kaEsitle() {
    if (!kaKullaniciId || !kaBekleyenKayit || kaCakismaVar) return;
    if (kaKayitCalisiyor) return kaKayitCalisiyor;
    kaKayitCalisiyor = (async () => {
        const uid = kaKullaniciId;
        const degisiklik = kaDegisiklikSayisi;
        const veriler = kaYerelVeriler();
        try {
            const { data: oturum, error: oturumHatasi } = await supabaseClient.auth.getUser();
            if (oturumHatasi || oturum.user?.id !== uid) throw new Error("Oturum değişmiş. Kayıt gönderilmedi.");
            const yeniTarih = new Date().toISOString();
            let sonuc, hata;
            if (kaBulutSatiriVar) {
                ({ data: sonuc, error: hata } = await supabaseClient
                    .from("kullanici_verileri")
                    .update({ veriler, guncellenme_tarihi: yeniTarih })
                    .eq("user_id", uid)
                    .eq("guncellenme_tarihi", kaBulutSurumu)
                    .select("guncellenme_tarihi")
                    .maybeSingle());
                if (!hata && !sonuc) {
                    kaCakismaVar = true;
                    throw new Error("Buluttaki kayıt başka cihazda değişmiş. Yerel kayıtların korundu.");
                }
            } else {
                ({ data: sonuc, error: hata } = await supabaseClient
                    .from("kullanici_verileri")
                    .insert({ user_id: uid, veriler, guncellenme_tarihi: yeniTarih })
                    .select("guncellenme_tarihi")
                    .single());
                if (hata?.code === "23505") kaCakismaVar = true;
            }
            if (hata) throw hata;
            if (kaKullaniciId !== uid) return;
            kaBulutSurumu = sonuc.guncellenme_tarihi;
            kaBulutSatiriVar = true;
            kaBekleyenKayit = degisiklik !== kaDegisiklikSayisi;
            kaSonHata = null;
            kaMetaKaydet();
            kaDurumGoster(kaBekleyenKayit ? "☁️ Diğer değişiklikler eşitleniyor..." : "☁️ Kayıtların güncel.");
        } catch (hata) {
            kaSonHata = hata;
            kaDurumGoster("Eşitleme tamamlanamadı: " + hata.message + " Yerel kayıtlar saklandı.", true);
            throw hata;
        }
    })();
    try { await kaKayitCalisiyor; }
    finally {
        kaKayitCalisiyor = null;
        if (kaBekleyenKayit && !kaCakismaVar && !kaSonHata) {
            clearTimeout(kaKayitZamani);
            kaKayitZamani = setTimeout(() => { kaEsitle().catch(console.error); }, 700);
        }
    }
}

async function kaBekleyenleriEsitle() {
    clearTimeout(kaKayitZamani);
    if (kaKayitCalisiyor) await kaKayitCalisiyor;
    if (!kaBekleyenKayit) return true;
    await kaEsitle();
    return !kaBekleyenKayit;
}

// Kullanıcı bağlantı düzelince manuel deneyebilir; çakışmada üzerine yazılmaz.
document.getElementById("ka-sync-tekrar")?.addEventListener("click", async function () {
    try {
        const tamam = await kaBekleyenleriEsitle();
        if (tamam) kaDurumGoster("☁️ Kayıtların güncel.");
    } catch (hata) { console.warn("Eşitleme tekrar denemesi:", hata.message); }
});
