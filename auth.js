// Kendime Alan - Supabase bağlantısı

const SUPABASE_URL = "https://pnhlmgmjntiopuyhftdj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_we5hYjPlF2AUNthUhaz4cw_Mec-A3w8";

const kaSifirlamaBaglantisi =
    /(?:[?#&])type=recovery(?:[&#]|$)/.test(window.location.href) ||
    new URLSearchParams(window.location.search).get("type") === "recovery";
let kaSifirlamaModu = kaSifirlamaBaglantisi;
let kaSifirlamaDogrulandi = false;

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
// 🌷 Giriş formunun elemanları
const girisEkrani = document.getElementById("giris-ekrani");
const girisFormu = document.getElementById("giris-formu");
const girisMesaji = document.getElementById("giris-mesaji");
const girisEmail = document.getElementById("giris-email");
const girisSifre = document.getElementById("giris-sifre");

// 🌷 E-posta ve şifreyle giriş yapma
girisFormu.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = girisEmail.value.trim();
    const sifre = girisSifre.value;

    girisMesaji.textContent = "Giriş yapılıyor...";

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: sifre
    });

    if (error) {
        girisMesaji.textContent = "Giriş başarısız. E-posta ve şifreni kontrol et.";
        return;
    }

    girisSifre.value = "";
    girisMesaji.textContent = "Giriş başarılı! 🌷";
});

// 🌷 E-posta ve şifreyle hesap oluşturma
const kayitOlBtn = document.getElementById("kayit-ol-btn");

kayitOlBtn.addEventListener("click", async function () {
    const email = girisEmail.value.trim();
    const sifre = girisSifre.value;

    if (!email || !girisEmail.checkValidity() || sifre.length < 10) {
        girisMesaji.textContent =
            "Geçerli bir e-posta ve en az 10 karakterli şifre gir.";
        return;
    }

    kayitOlBtn.disabled = true;
    girisMesaji.textContent = "Hesabın oluşturuluyor...";

    try {
        const { error } = await supabaseClient.auth.signUp({
            email: email,
            password: sifre,
            options: {
                emailRedirectTo: "https://aslinurcosgun.github.io/kendime-alan/"
            }
        });

        if (error) {
            girisMesaji.textContent =
                "Hesap oluşturulamadı. Bilgilerini kontrol edip tekrar dene.";
            return;
        }

        girisSifre.value = "";
        girisMesaji.textContent =
            "İşlem tamamlandı. E-posta adresine gelen doğrulama bağlantısını kontrol et. 🌷";

    } catch (error) {
        girisMesaji.textContent =
            "Bağlantı sorunu oluştu. Lütfen tekrar dene.";
    } finally {
        kayitOlBtn.disabled = false;
    }
});
// 🌷 Şifremi Unuttum
const sifremiUnuttumBtn = document.getElementById("sifremi-unuttum-btn");

sifremiUnuttumBtn.addEventListener("click", async function () {
    const email = girisEmail.value.trim();

    if (!email || !girisEmail.checkValidity()) {
        girisMesaji.textContent =
            "Önce geçerli bir e-posta adresi gir.";
        return;
    }

    sifremiUnuttumBtn.disabled = true;
    girisMesaji.textContent = "Şifre sıfırlama bağlantısı gönderiliyor...";

    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(
            email,
            {
                redirectTo: new URL(window.location.pathname, window.location.origin).href
            }
        );

        if (error) {
            girisMesaji.textContent =
                "İşlem tamamlanamadı. Biraz sonra tekrar dene.";
            return;
        }

        girisMesaji.textContent =
            "Bu e-posta için bir hesap varsa şifre sıfırlama bağlantısı gönderilecektir. 🌷";

    } catch (error) {
        girisMesaji.textContent =
            "Bağlantı sorunu oluştu. Lütfen tekrar dene.";
    } finally {
        sifremiUnuttumBtn.disabled = false;
    }
});
// 🌷 Oturum ve veri hazır olmadan kişisel uygulamayı AÇMA.
const uygulamaAlani = document.querySelector("main.uygulama");
const altMenu = document.querySelector("nav.alt-menu");
const cikisYapBtn = document.getElementById("cikis-yap-btn");
let kaAktifKullanici = null;
let kaBaslatmaSozu = null;
let kaUygulamaYuklendi = false;

const kaYukleniyor = document.getElementById("ka-yukleniyor");
const kaSifreYenile = document.getElementById("ka-sifre-yenile");
const kaSifreMesaj = document.getElementById("ka-sifre-yenile-mesaj");
const kaSifreButon = document.getElementById("ka-sifre-yenile-buton");

function kaSifreEkraniAc(mesaj) {
    kaEkraniGoster("sifre");
    kaSifreMesaj.textContent = mesaj;
    kaSifreButon.disabled = !kaSifirlamaDogrulandi;
}

function kaSifreLinkiniTemizle() {
    // Token içeren bağlantının adres çubuğunda kalmasını engelle.
    const url = new URL(window.location.href);
    url.hash = "";
    for (const key of ["type", "code", "token", "token_hash", "error", "error_code", "error_description"]) {
        url.searchParams.delete(key);
    }
    window.history.replaceState(null, "", url.pathname + url.search);
}

document.getElementById("ka-sifre-yenile-formu").addEventListener("submit", async event => {
    event.preventDefault();
    if (!kaSifirlamaModu || !kaSifirlamaDogrulandi) return;
    const sifre = document.getElementById("ka-yeni-sifre").value;
    const tekrar = document.getElementById("ka-yeni-sifre-tekrar").value;
    if (sifre.length < 10 || sifre !== tekrar) {
        kaSifreMesaj.textContent = "Şifreler aynı olmalı ve en az 10 karakter içermeli.";
        return;
    }
    kaSifreButon.disabled = true;
    kaSifreMesaj.textContent = "Şifren güncelleniyor...";
    try {
        const { error } = await supabaseClient.auth.updateUser({ password: sifre });
        if (error) throw error;
        document.getElementById("ka-yeni-sifre").value = "";
        document.getElementById("ka-yeni-sifre-tekrar").value = "";
        kaSifirlamaModu = false;
        kaSifirlamaDogrulandi = false;
        kaSifreLinkiniTemizle();
        const { error: cikisHatasi } = await supabaseClient.auth.signOut();
        if (cikisHatasi) throw cikisHatasi;
        kaEkraniGoster("giris");
        girisMesaji.textContent = "Şifren güncellendi! Yeni şifrenle giriş yapabilirsin. 🌷";
    } catch (hata) {
        console.error("Şifre değiştirme başarısız:", hata.message);
        kaSifreMesaj.textContent = "Şifre güncellenemedi. Bağlantının süresini ve şifre kurallarını kontrol et.";
        kaSifreButon.disabled = !kaSifirlamaDogrulandi;
    }
});

document.getElementById("ka-sifre-yenile-don").addEventListener("click", async () => {
    kaSifirlamaModu = false;
    kaSifirlamaDogrulandi = false;
    kaSifreLinkiniTemizle();
    const { error } = await supabaseClient.auth.signOut();
    if (error) console.warn("Oturum kapatılamadı:", error.message);
    window.location.reload();
});
function kaEkraniGoster(durum) {
    kaYukleniyor.hidden = durum !== "yukleniyor";
    kaSifreYenile.hidden = durum !== "sifre";
    girisEkrani.hidden = durum !== "giris";
    uygulamaAlani.hidden = durum !== "uygulama";
    altMenu.hidden = durum !== "uygulama";
    cikisYapBtn.hidden = durum !== "uygulama";
}

function kaEskiUygulamayiYukle() {
    if (kaUygulamaYuklendi) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const js = document.createElement("script");
        js.src = "script.js";
        js.onload = () => { kaUygulamaYuklendi = true; resolve(); };
        js.onerror = () => reject(new Error("Uygulama dosyası yüklenemedi."));
        document.body.appendChild(js);
    });
}

async function kaOturumlaBaslat() {
    if (kaSifirlamaModu) return;
    if (kaBaslatmaSozu) return kaBaslatmaSozu;
    kaBaslatmaSozu = (async () => {
        const { data, error } = await supabaseClient.auth.getUser();
        if (error || !data.user) {
            kaEkraniGoster("giris");
            kaAktifKullanici = null;
            return;
        }
        const uid = data.user.id;
        if (kaUygulamaYuklendi) {
            // Tek sayfada başka kullanıcıya geçişe izin verme.
            if (kaAktifKullanici !== uid) window.location.reload();
            return;
        }
        girisMesaji.textContent = "Kayıtların güvenle yükleniyor...";
        kaEkraniGoster("yukleniyor");
        try {
            await kaVeriyiBaslat(uid);
            await kaEskiUygulamayiYukle();
            const son = await supabaseClient.auth.getUser();
            if (son.error || son.data.user?.id !== uid) {
                window.location.reload();
                return;
            }
            kaAktifKullanici = uid;
            kaEkraniGoster("uygulama");
            girisMesaji.textContent = "";
        } catch (hata) {
            console.error("Kişisel veriler yüklenemedi:", hata);
            girisMesaji.textContent = "Kayıtlar yüklenemedi. İnternet bağlantını kontrol edip sayfayı yenile. Hiçbir kayıt silinmedi.";
            kaEkraniGoster("giris");
        }
    })();
    try { await kaBaslatmaSozu; }
    finally { kaBaslatmaSozu = null; }
}

kaEkraniGoster("yukleniyor");
if (kaSifirlamaModu) {
    kaSifreEkraniAc("Bağlantı doğrulanıyor...");
}
// Supabase event callback'i içinde async ağ çağrısı yapmıyoruz.
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
        kaSifirlamaModu = true;
        kaSifirlamaDogrulandi = !!session?.user;
        kaSifreEkraniAc(kaSifirlamaDogrulandi
            ? "Bağlantın doğrulandı. Yeni şifreni yazabilirsin."
            : "Bağlantı doğrulanamadı. Yeni sıfırlama e-postası iste.");
        return;
    }
    if (kaSifirlamaModu) {
        // Recovery oturumunu normal uygulama oturumuyla karıştırma.
        return;
    }
    if (event === "SIGNED_OUT") {
        kaEkraniGoster("giris");
        // script.js belleğinde eski hesap kayıtları kalabileceği için yeniden başlat.
        if (kaUygulamaYuklendi) window.location.reload();
    } else if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        if (session?.user && !kaUygulamaYuklendi) {
            setTimeout(() => { if (!kaSifirlamaModu) kaOturumlaBaslat().catch(console.error); }, 0);
        }
    }
});
kaOturumlaBaslat().catch(console.error);

cikisYapBtn.addEventListener("click", async function () {
    cikisYapBtn.disabled = true;
    try {
        // Bekleyen değişiklik varken oturum kapatılmasın.
        if (!(await kaBekleyenleriEsitle())) {
            throw new Error("Bekleyen değişiklikler henüz eşitlenemedi.");
        }
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        window.location.reload();
    } catch (hata) {
        alert("Çıkış tamamlanamadı: " + hata.message + " Yerel kayıtların korunuyor.");
        cikisYapBtn.disabled = false;
    }
});
