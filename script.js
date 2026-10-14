
// MENU SISTEMI

const menuButonlari = document.querySelectorAll(
    ".alt-menu button"
);

const sayfalar = document.querySelectorAll(".sayfa");

menuButonlari.forEach(function(buton) {
    buton.addEventListener("click", function() {
        const sayfaAdi = buton.dataset.sayfa;

        sayfalar.forEach(function(sayfa) {
            sayfa.hidden = true;
        });

        document.getElementById(sayfaAdi).hidden = false;

        menuButonlari.forEach(function(menuButonu) {
            menuButonu.classList.remove("aktif");
        });

        buton.classList.add("aktif");

        window.scrollTo(0, 0);
    });
});


// TAKVIM SISTEMI

const takvimAyBaslik = document.getElementById(
    "takvim-ay-baslik"
);

const takvimGunler = document.getElementById(
    "takvim-gunler"
);

const oncekiAyButon = document.getElementById("onceki-ay");
const sonrakiAyButon = document.getElementById("sonraki-ay");

const secilenTarihBaslik = document.getElementById(
    "secilen-tarih-baslik"
);

const bugun = new Date();

let gorunenYil = bugun.getFullYear();
let gorunenAy = bugun.getMonth();

let secilenTarih = new Date(
    bugun.getFullYear(),
    bugun.getMonth(),
    bugun.getDate()
);

// Tarihi YYYY-MM-DD formatina cevir
function tarihAnahtari(tarih) {
    const yil = tarih.getFullYear();
    const ay = String(tarih.getMonth() + 1).padStart(2, "0");
    const gun = String(tarih.getDate()).padStart(2, "0");

    return `${yil}-${ay}-${gun}`;
}

// Secilen tarihi baslikta goster
function secilenTarihiGoster() {
    const tarihMetni = secilenTarih.toLocaleDateString(
        "tr-TR",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

    secilenTarihBaslik.textContent = tarihMetni + " 🌷";
}

// Takvim gunlerini olustur
function takvimiGoster() {
    takvimGunler.innerHTML = "";

    const ayTarihi = new Date(gorunenYil, gorunenAy, 1);

    takvimAyBaslik.textContent =
        ayTarihi.toLocaleDateString("tr-TR", {
            month: "long",
            year: "numeric"
        });

    const ilkGun = ayTarihi.getDay();
    const baslangicBosluk = (ilkGun + 6) % 7;

    const toplamGun = new Date(
        gorunenYil,
        gorunenAy + 1,
        0
    ).getDate();

    // Ayin ilk gununden onceki bos alanlar
    for (let i = 0; i < baslangicBosluk; i++) {
        const bosAlan = document.createElement("span");
        bosAlan.setAttribute("aria-hidden", "true");
        takvimGunler.appendChild(bosAlan);
    }

    for (let gun = 1; gun <= toplamGun; gun++) {
        const gunButonu = document.createElement("button");
        gunButonu.type = "button";
        gunButonu.textContent = gun;

        const gunTarihi = new Date(
            gorunenYil,
            gorunenAy,
            gun
        );

        const gunAnahtari = tarihAnahtari(gunTarihi);

        gunButonu.setAttribute(
            "aria-label",
            gunTarihi.toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric"
            })
        );

        // Bugunu isaretle
        if (gunAnahtari === tarihAnahtari(bugun)) {
            gunButonu.classList.add("bugun");
        }

        // Secilen gunu isaretle
        const seciliMi =
            gunAnahtari === tarihAnahtari(secilenTarih);

        gunButonu.setAttribute("aria-pressed", String(seciliMi));

        if (seciliMi) {
            gunButonu.classList.add("secili-gun");
        }

        // Gorev olan gunlere nokta ekle
        const gorevVar = gorevler.some(function(gorev) {
            return gorev.tarih === gunAnahtari;
        });

        if (gorevVar) {
            gunButonu.classList.add("gorev-var");
        }

        // Ozel gun emojilerini takvimde goster
        const ozelGunler = (window.kaOzelGunler || []).filter(ozel => {
            return ozel.tekrar ? ozel.tarih.slice(5) === gunAnahtari.slice(5) : ozel.tarih === gunAnahtari;
        });
        if (ozelGunler.length) {
            const simge = document.createElement("span");
            simge.className = "ka-takvim-emoji";
            simge.textContent = ozelGunler[0].emoji + (ozelGunler.length > 1 ? " +" + (ozelGunler.length - 1) : "");
            gunButonu.appendChild(simge);
            gunButonu.title = ozelGunler.map(x => x.ad).join(", ");
        }

        // Takvimden bir gun sec
        gunButonu.addEventListener("click", function() {
            secilenTarih = gunTarihi;

            takvimiGoster();
            secilenTarihiGoster();
            gorevleriGoster();
            haftalikTarihiGuncelle();
            aylikTarihiGuncelle();
        });

        takvimGunler.appendChild(gunButonu);
    }
}

// Onceki aya gec
oncekiAyButon.addEventListener("click", function() {
    const yeniAy = new Date(gorunenYil, gorunenAy - 1, 1);

    gorunenYil = yeniAy.getFullYear();
    gorunenAy = yeniAy.getMonth();

    takvimiGoster();
});

// Sonraki aya gec
sonrakiAyButon.addEventListener("click", function() {
    const yeniAy = new Date(gorunenYil, gorunenAy + 1, 1);

    gorunenYil = yeniAy.getFullYear();
    gorunenAy = yeniAy.getMonth();

    takvimiGoster();
});


// GOREV YONETIM SISTEMI

const gorevForm = document.getElementById("gorev-form");
const gorevInput = document.getElementById("gorev-input");
const gorevListesi = document.getElementById("gorev-listesi");

const bosGorevMesaji = document.getElementById(
    "bos-gorev-mesaji"
);

const tarihsizGorevListesi = document.getElementById(
    "tarihsiz-gorev-listesi"
);

const bosTarihsizMesaji = document.getElementById(
    "bos-tarihsiz-mesaji"
);

// Eski localStorage kayitlarini yukle
let gorevler = [];

try {
    const kayitliGorevler = JSON.parse(
        localStorage.getItem("kendimeAlanGorevler") || "[]"
    );

    if (Array.isArray(kayitliGorevler)) {
        gorevler = kayitliGorevler;
    }
} catch (hata) {
    console.error("Gorevler okunamadi:", hata);
    alert("Görev kayıtları okunamadı. Yedeğini koru.");
}

// Gorevleri kaydet
function gorevleriKaydet() {
    try {
        localStorage.setItem(
            "kendimeAlanGorevler",
            JSON.stringify(gorevler)
        );

        return true;
    } catch (hata) {
        console.error("Kayit hatasi:", hata);
        alert("Görevler kaydedilemedi.");

        return false;
    }
}

// Tek bir gorev karti olustur
function gorevKartiOlustur(gorev, tarihsizMi) {
    const yeniGorev = document.createElement("li");

    // Tamamlama kutusu
    const tamamlaKutusu = document.createElement("input");
    tamamlaKutusu.type = "checkbox";
    tamamlaKutusu.checked = gorev.tamamlandi === true;
    tamamlaKutusu.setAttribute(
        "aria-label",
        "Görevi tamamlandı olarak işaretle"
    );

    // Gorev metni
    const gorevYazisi = document.createElement("span");
    gorevYazisi.textContent = gorev.metin;

    if (gorev.tamamlandi) {
        gorevYazisi.classList.add("tamamlandi");
    }

    // Duzenleme butonu
    const duzenleButonu = document.createElement("button");
    duzenleButonu.type = "button";
    duzenleButonu.textContent = "✏️";
    duzenleButonu.className = "gorev-duzenle";
    duzenleButonu.setAttribute("aria-label", "Görevi düzenle");

    // Silme butonu
    const silButonu = document.createElement("button");
    silButonu.type = "button";
    silButonu.textContent = "🗑️";
    silButonu.className = "gorev-sil";
    silButonu.setAttribute("aria-label", "Görevi sil");

    // Gorevi tamamla
    tamamlaKutusu.addEventListener("change", function() {
        gorev.tamamlandi = tamamlaKutusu.checked;

        gorevleriKaydet();
        gorevleriGoster();
    });

    // Gorev metnini duzenle
    duzenleButonu.addEventListener("click", function() {
        const yeniMetin = prompt(
            "Görevini düzenle:",
            gorev.metin
        );

        if (yeniMetin === null) {
            return;
        }

        const temizMetin = yeniMetin.trim();

        if (temizMetin === "" || temizMetin.length > 120) {
            alert("Görev 1 ile 120 karakter arasında olmalı.");
            return;
        }

        gorev.metin = temizMetin;

        gorevleriKaydet();
        gorevleriGoster();
    });

    // Gorevi sil
    silButonu.addEventListener("click", function() {
        gorevler = gorevler.filter(function(kayit) {
            return kayit.id !== gorev.id;
        });

        gorevleriKaydet();
        gorevleriGoster();
        takvimiGoster();
    });

    yeniGorev.appendChild(tamamlaKutusu);
    yeniGorev.appendChild(gorevYazisi);

    // Tarihsiz goreve secilen gunu ata
    if (tarihsizMi) {
        const tarihAtaButonu = document.createElement("button");
        tarihAtaButonu.type = "button";
        tarihAtaButonu.textContent = "📅";
        tarihAtaButonu.className = "gorev-tarih-ata";
        tarihAtaButonu.title = "Seçili güne ata";
        tarihAtaButonu.setAttribute(
            "aria-label",
            "Görevi takvimde seçili güne ata"
        );

        tarihAtaButonu.addEventListener("click", function() {
            gorev.tarih = tarihAnahtari(secilenTarih);

            gorevleriKaydet();
            gorevleriGoster();
            takvimiGoster();
        });

        yeniGorev.appendChild(tarihAtaButonu);
    }

    yeniGorev.appendChild(duzenleButonu);
    yeniGorev.appendChild(silButonu);

    return yeniGorev;
}

// Gorevleri tarihlerine gore ekranda goster
function gorevleriGoster() {
    gorevListesi.innerHTML = "";
    tarihsizGorevListesi.innerHTML = "";

    const secilenGun = tarihAnahtari(secilenTarih);

    const gununGorevleri = gorevler.filter(function(gorev) {
        return gorev.tarih === secilenGun;
    });

    const tarihsizGorevler = gorevler.filter(function(gorev) {
        return !gorev.tarih;
    });

    gununGorevleri.forEach(function(gorev) {
        gorevListesi.appendChild(
            gorevKartiOlustur(gorev, false)
        );
    });

    tarihsizGorevler.forEach(function(gorev) {
        tarihsizGorevListesi.appendChild(
            gorevKartiOlustur(gorev, true)
        );
    });

    bosGorevMesaji.textContent =
        "Bu gün için henüz görev eklemedin.";

    bosGorevMesaji.hidden = gununGorevleri.length > 0;

    bosTarihsizMesaji.hidden =
        tarihsizGorevler.length > 0;
}

// Yeni gorev ekle
gorevForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const gorevMetni = gorevInput.value.trim();

    if (gorevMetni === "") {
        return;
    }

    const yeniGorev = {
        id: crypto.randomUUID(),
        metin: gorevMetni,
        tamamlandi: false,
        tarih: tarihAnahtari(secilenTarih)
    };

    gorevler.push(yeniGorev);

    gorevleriKaydet();
    gorevleriGoster();
    takvimiGoster();

    gorevInput.value = "";
    gorevInput.focus();
});

// Uygulama acildiginda
takvimiGoster();
secilenTarihiGoster();
gorevleriGoster();

// HAFTALIK PLAN SISTEMI

const haftalikForm = document.getElementById("haftalik-form");
const haftalikInput = document.getElementById("haftalik-input");
const haftalikListe = document.getElementById("haftalik-liste");

const haftaTarihleri = document.getElementById(
    "hafta-tarihleri"
);

const haftalikSayac = document.getElementById(
    "haftalik-sayac"
);

const haftalikDoluluk = document.getElementById(
    "haftalik-doluluk"
);

const bosHaftalikMesaji = document.getElementById(
    "bos-haftalik-mesaji"
);

// Haftanin pazartesi tarihini bul
function haftaninBaslangici(tarih) {
    const sonuc = new Date(
        tarih.getFullYear(),
        tarih.getMonth(),
        tarih.getDate()
    );

    const gun = (sonuc.getDay() + 6) % 7;

    sonuc.setDate(sonuc.getDate() - gun);

    return sonuc;
}
let haftaBaslangici = haftaninBaslangici(secilenTarih);

let haftaBitisi = new Date(haftaBaslangici);
haftaBitisi.setDate(haftaBitisi.getDate() + 6);

let haftaAnahtari = tarihAnahtari(haftaBaslangici);

// Haftanin tarih araligini goster
haftaTarihleri.textContent =
    haftaBaslangici.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short"
    }) +
    " – " +
    haftaBitisi.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

// Kayitli haftalik planlari yukle
let haftalikPlanlar = [];

try {
    const kayitlar = JSON.parse(
        localStorage.getItem("kendimeAlanHaftalikPlanlar") || "[]"
    );

    if (Array.isArray(kayitlar)) {
        haftalikPlanlar = kayitlar;
    }
} catch (hata) {
    console.error("Haftalik planlar okunamadi:", hata);
    alert("Haftalık plan kayıtları okunamadı.");
}

// Haftalik planlari kaydet
function haftalikKaydet() {
    try {
        localStorage.setItem(
            "kendimeAlanHaftalikPlanlar",
            JSON.stringify(haftalikPlanlar)
        );

        return true;
    } catch (hata) {
        console.error("Haftalik kayit hatasi:", hata);
        alert("Haftalık plan kaydedilemedi.");
        return false;
    }
}

// Bu haftanin planlarini ekranda goster
function haftalikGoster() {
    haftalikListe.innerHTML = "";

    const buHafta = haftalikPlanlar.filter(function(plan) {
        return plan.hafta === haftaAnahtari;
    });

    buHafta.forEach(function(plan) {
        const satir = document.createElement("li");

        const kutu = document.createElement("input");
        kutu.type = "checkbox";
        kutu.checked = plan.tamamlandi;
        kutu.setAttribute(
            "aria-label",
            "Planı tamamlandı olarak işaretle"
        );

        const metin = document.createElement("span");
        metin.textContent = plan.metin;

        if (plan.tamamlandi) {
            metin.classList.add("tamamlandi");
        }

        const sil = document.createElement("button");
        sil.type = "button";
        sil.textContent = "🗑️";
        sil.className = "haftalik-sil";
        sil.setAttribute("aria-label", "Planı sil");

        // Tamamlama durumunu degistir
        kutu.addEventListener("change", function() {
            plan.tamamlandi = kutu.checked;

            haftalikKaydet();
            haftalikGoster();
        });

        // Plani sil
        sil.addEventListener("click", function() {
            haftalikPlanlar = haftalikPlanlar.filter(function(kayit) {
                return kayit.id !== plan.id;
            });

            haftalikKaydet();
            haftalikGoster();
        });

        satir.appendChild(kutu);
        satir.appendChild(metin);
        satir.appendChild(sil);

        haftalikListe.appendChild(satir);
    });

    // Ilerleme cubugunu guncelle
    const toplam = buHafta.length;

    const tamamlanan = buHafta.filter(function(plan) {
        return plan.tamamlandi;
    }).length;

    haftalikSayac.textContent = tamamlanan + "/" + toplam;

    const yuzde = toplam > 0
        ? (tamamlanan / toplam) * 100
        : 0;

    haftalikDoluluk.style.width = yuzde + "%";

    bosHaftalikMesaji.hidden = toplam > 0;
}
// Takvimde secilen tarihe gore haftalik plani guncelle
function haftalikTarihiGuncelle() {
    haftaBaslangici = haftaninBaslangici(secilenTarih);

    haftaBitisi = new Date(haftaBaslangici);
    haftaBitisi.setDate(haftaBitisi.getDate() + 6);

    haftaAnahtari = tarihAnahtari(haftaBaslangici);

    haftaTarihleri.textContent =
        haftaBaslangici.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "short"
        }) +
        " – " +
        haftaBitisi.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    haftalikGoster();
}

// Yeni haftalik plan ekle
haftalikForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const metin = haftalikInput.value.trim();

    if (metin === "") {
        return;
    }

    haftalikPlanlar.push({
        id: crypto.randomUUID(),
        metin: metin,
        tamamlandi: false,
        hafta: haftaAnahtari
    });

    haftalikKaydet();
    haftalikGoster();

    haftalikInput.value = "";
});

// Sayfa acildiginda haftalik planlari goster
haftalikGoster();

// AYLIK PLAN SISTEMI

const aylikForm = document.getElementById("aylik-form");
const aylikInput = document.getElementById("aylik-input");
const aylikListe = document.getElementById("aylik-liste");

const aylikTarih = document.getElementById("aylik-tarih");
const aylikSayac = document.getElementById("aylik-sayac");
const aylikDoluluk = document.getElementById("aylik-doluluk");

const bosAylikMesaji = document.getElementById(
    "bos-aylik-mesaji"
);

// Bugunun ayini belirle
let aylikBugun = new Date(secilenTarih);

let aylikYil = aylikBugun.getFullYear();
let aylikAy = aylikBugun.getMonth();

let ayAnahtari =
    aylikYil + "-" + String(aylikAy + 1).padStart(2, "0");
// Ay basligini Turkce goster
aylikTarih.textContent = aylikBugun.toLocaleDateString(
    "tr-TR",
    {
        month: "long",
        year: "numeric"
    }
);

// Kayitli aylik planlari yukle
let aylikPlanlar = [];

try {
    const kayitlar = JSON.parse(
        localStorage.getItem("kendimeAlanAylikPlanlar") || "[]"
    );

    if (Array.isArray(kayitlar)) {
        aylikPlanlar = kayitlar;
    }
} catch (hata) {
    console.error("Aylik planlar okunamadi:", hata);
    alert("Aylık plan kayıtları okunamadı.");
}

// Aylik planlari kaydet
function aylikKaydet() {
    try {
        localStorage.setItem(
            "kendimeAlanAylikPlanlar",
            JSON.stringify(aylikPlanlar)
        );

        return true;
    } catch (hata) {
        console.error("Aylik kayit hatasi:", hata);
        alert("Aylık plan kaydedilemedi.");
        return false;
    }
}

// Bu ayin planlarini goster
function aylikGoster() {
    aylikListe.innerHTML = "";

    const buAy = aylikPlanlar.filter(function(plan) {
        return plan.ay === ayAnahtari;
    });

    buAy.forEach(function(plan) {
        const satir = document.createElement("li");

        const kutu = document.createElement("input");
        kutu.type = "checkbox";
        kutu.checked = plan.tamamlandi;
        kutu.setAttribute(
            "aria-label",
            "Planı tamamlandı olarak işaretle"
        );

        const metin = document.createElement("span");
        metin.textContent = plan.metin;

        if (plan.tamamlandi) {
            metin.classList.add("tamamlandi");
        }

        const sil = document.createElement("button");
        sil.type = "button";
        sil.textContent = "🗑️";
        sil.className = "aylik-sil";
        sil.setAttribute("aria-label", "Planı sil");

        // Tamamlama durumunu degistir
        kutu.addEventListener("change", function() {
            plan.tamamlandi = kutu.checked;

            aylikKaydet();
            aylikGoster();
        });

        // Plani sil
        sil.addEventListener("click", function() {
            aylikPlanlar = aylikPlanlar.filter(function(kayit) {
                return kayit.id !== plan.id;
            });

            aylikKaydet();
            aylikGoster();
        });

        satir.appendChild(kutu);
        satir.appendChild(metin);
        satir.appendChild(sil);

        aylikListe.appendChild(satir);
    });

    // Ilerleme durumunu hesapla
    const toplam = buAy.length;

    const tamamlanan = buAy.filter(function(plan) {
        return plan.tamamlandi;
    }).length;

    aylikSayac.textContent = tamamlanan + "/" + toplam;

    const yuzde = toplam > 0
        ? (tamamlanan / toplam) * 100
        : 0;

    aylikDoluluk.style.width = yuzde + "%";

    bosAylikMesaji.hidden = toplam > 0;
}

// Takvimde secilen tarihe gore aylik plani guncelle
function aylikTarihiGuncelle() {
    aylikBugun = new Date(secilenTarih);

    aylikYil = aylikBugun.getFullYear();
    aylikAy = aylikBugun.getMonth();

    ayAnahtari =
        aylikYil + "-" + String(aylikAy + 1).padStart(2, "0");

    aylikTarih.textContent = aylikBugun.toLocaleDateString(
        "tr-TR",
        {
            month: "long",
            year: "numeric"
        }
    );

    aylikGoster();
}
// Yeni aylik plan ekle
aylikForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const metin = aylikInput.value.trim();

    if (metin === "") {
        return;
    }

    aylikPlanlar.push({
        id: crypto.randomUUID(),
        metin: metin,
        tamamlandi: false,
        ay: ayAnahtari
    });

    aylikKaydet();
    aylikGoster();

    aylikInput.value = "";
});

// Sayfa acildiginda aylik planlari goster
aylikGoster();

// HEDEF YONETIM SISTEMI

const hedefForm = document.getElementById("hedef-form");
const hedefInput = document.getElementById("hedef-input");
const hedefListesi = document.getElementById("hedef-listesi");

const hedefSayac = document.getElementById("hedef-sayac");
const hedefDoluluk = document.getElementById("hedef-doluluk");

const bosHedefMesaji = document.getElementById(
    "bos-hedef-mesaji"
);

// Kayitli hedefleri yukle
let hedefler = [];

try {
    const kayitlar = JSON.parse(
        localStorage.getItem("kendimeAlanHedefler") || "[]"
    );

    if (Array.isArray(kayitlar)) {
        hedefler = kayitlar;
    }
} catch (hata) {
    console.error("Hedefler okunamadi:", hata);
    alert("Hedef kayıtları okunamadı. Mevcut verilerini kontrol et.");
}

// Hedefleri kaydet
function hedefleriKaydet() {
    try {
        localStorage.setItem(
            "kendimeAlanHedefler",
            JSON.stringify(hedefler)
        );

        return true;
    } catch (hata) {
        console.error("Hedef kayit hatasi:", hata);
        alert("Hedefler kaydedilemedi.");
        return false;
    }
}

// Hedefleri ekranda goster
function hedefleriGoster() {
    hedefListesi.innerHTML = "";

    hedefler.forEach(function(hedef) {
        const satir = document.createElement("li");

        // Tamamlama kutusu
        const kutu = document.createElement("input");
        kutu.type = "checkbox";
        kutu.checked = hedef.tamamlandi === true;
        kutu.setAttribute(
            "aria-label",
            "Hedefi tamamlandı olarak işaretle"
        );

        // Hedef metni
        const metin = document.createElement("span");
        metin.textContent = hedef.metin;

        if (hedef.tamamlandi) {
            metin.classList.add("tamamlandi");
        }

        // Duzenleme butonu
        const duzenle = document.createElement("button");
        duzenle.type = "button";
        duzenle.textContent = "✏️";
        duzenle.className = "hedef-duzenle";
        duzenle.setAttribute("aria-label", "Hedefi düzenle");

        // Silme butonu
        const sil = document.createElement("button");
        sil.type = "button";
        sil.textContent = "🗑️";
        sil.className = "hedef-sil";
        sil.setAttribute("aria-label", "Hedefi sil");

        // Tamamlama durumunu degistir
        kutu.addEventListener("change", function() {
            hedef.tamamlandi = kutu.checked;

            hedefleriKaydet();
            hedefleriGoster();
        });

        // Hedef metnini duzenle
        duzenle.addEventListener("click", function() {
            const yeniMetin = prompt(
                "Hedefini düzenle:",
                hedef.metin
            );

            if (yeniMetin === null) {
                return;
            }

            const temizMetin = yeniMetin.trim();

            if (temizMetin === "" || temizMetin.length > 150) {
                alert("Hedef 1 ile 150 karakter arasında olmalı.");
                return;
            }

            hedef.metin = temizMetin;

            hedefleriKaydet();
            hedefleriGoster();
        });

        // Hedefi sil
        sil.addEventListener("click", function() {
            hedefler = hedefler.filter(function(kayit) {
                return kayit.id !== hedef.id;
            });

            hedefleriKaydet();
            hedefleriGoster();
        });

        satir.appendChild(kutu);
        satir.appendChild(metin);
        satir.appendChild(duzenle);
        satir.appendChild(sil);

        hedefListesi.appendChild(satir);
    });

    // Ilerleme oranini hesapla
    const toplam = hedefler.length;

    const tamamlanan = hedefler.filter(function(hedef) {
        return hedef.tamamlandi === true;
    }).length;

    hedefSayac.textContent = tamamlanan + "/" + toplam;

    const yuzde = toplam > 0
        ? (tamamlanan / toplam) * 100
        : 0;

    hedefDoluluk.style.width = yuzde + "%";

    bosHedefMesaji.hidden = toplam > 0;
}

// Yeni hedef ekle
hedefForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const metin = hedefInput.value.trim();

    if (metin === "") {
        return;
    }

    const yeniHedef = {
        id: crypto.randomUUID(),
        metin: metin,
        tamamlandi: false
    };

    hedefler.push(yeniHedef);

    hedefleriKaydet();
    hedefleriGoster();

    hedefInput.value = "";
    hedefInput.focus();
});

// Sayfa acildiginda hedefleri goster
hedefleriGoster();

// SAGLIK VE BAKIM KAYIT SISTEMI

const saglikForm = document.getElementById("saglik-form");
const saglikTarih = document.getElementById("saglik-tarih");
const saglikDurum = document.getElementById("saglik-durum");
const saglikSil = document.getElementById("saglik-sil");
const saglikAnahtar = "kendimeAlanSaglik";
const rutinAnahtar = "kendimeAlanBakimRutini";

const saglikAlanlari = {
    uyku: "uyku-sure",
    uykuKalite: "uyku-kalite",
    su: "su-miktar",
    ruhHali: "ruh-hali",
    not: "saglik-not"
};

const varsayilanRutin = {
    sabah: [
        { id: "sabah-temizleme", metin: "Yüz temizleme" },
        { id: "sabah-nemlendirici", metin: "Nemlendirici" },
        { id: "sabah-gunes", metin: "Güneş koruyucu" }
    ],
    aksam: [
        { id: "aksam-temizleme", metin: "Yüz temizleme" },
        { id: "aksam-nemlendirici", metin: "Nemlendirici" }
    ]
};

let saglikKayitlari = {};
let bakimRutini = varsayilanRutin;
let saglikVerisiOkunabilir = true;
let duzenlenenOgunId = null;
let gunlukOgunler = [];
let gunlukSporlar = [];
let duzenlenenSporId = null;
let gunlukRutin = { sabah: [], aksam: [] };

// Kayitlari ve kalici rutin sablonunu oku
try {
    const eskiSaglik = JSON.parse(localStorage.getItem(saglikAnahtar) || "{}");
    if (!eskiSaglik || typeof eskiSaglik !== "object" || Array.isArray(eskiSaglik)) {
        throw new Error("Gecersiz saglik verisi");
    }
    saglikKayitlari = eskiSaglik;

    const eskiRutin = localStorage.getItem(rutinAnahtar);
    if (eskiRutin !== null) {
        const sonuc = JSON.parse(eskiRutin);
        if (!sonuc || !Array.isArray(sonuc.sabah) || !Array.isArray(sonuc.aksam)) {
            throw new Error("Gecersiz rutin verisi");
        }
        bakimRutini = sonuc;
    }
} catch (hata) {
    saglikVerisiOkunabilir = false;
    console.error("Saglik verisi okunamadi:", hata);
    alert("Sağlık veya bakım kaydı okunamadı. Önce yedeğini koru.");
}

function saglikDepola(anahtar, veri) {
    if (!saglikVerisiOkunabilir) return false;
    try {
        localStorage.setItem(anahtar, JSON.stringify(veri));
        return true;
    } catch (hata) {
        console.error("Saglik kaydi basarisiz:", hata);
        saglikDurum.textContent = "Kayıt yapılamadı. Depolama alanını kontrol et.";
        return false;
    }
}

function sayisalDeger(id) {
    const deger = document.getElementById(id).value;
    return deger === "" ? null : Number(deger);
}

function rutinKopyala(sablon) {
    return {
        sabah: (sablon.sabah || []).map(adim => ({
            id: adim.id, metin: adim.metin, tamamlandi: false
        })),
        aksam: (sablon.aksam || []).map(adim => ({
            id: adim.id, metin: adim.metin, tamamlandi: false
        }))
    };
}

function mevcutGunKaydi() {
    return saglikKayitlari[saglikTarih.value] || {};
}

function gunlukBilgileriDerle() {
    const kayit = { ...mevcutGunKaydi() };
    Object.entries(saglikAlanlari).forEach(function([anahtar, id]) {
        kayit[anahtar] = document.getElementById(id).value;
    });
    kayit.uyku = sayisalDeger("uyku-sure");
    kayit.su = sayisalDeger("su-miktar");
    kayit.sporlar = gunlukSporlar.map(x => ({ ...x }));
    kayit.ogunler = gunlukOgunler.map(x => ({ ...x }));
    kayit.rutin = {
        sabah: gunlukRutin.sabah.map(x => ({ ...x })),
        aksam: gunlukRutin.aksam.map(x => ({ ...x }))
    };
    return kayit;
}

function gunlukBosMu(kayit) {
    const alanDolu = Object.keys(saglikAlanlari).some(function(anahtar) {
        return kayit[anahtar] !== null && kayit[anahtar] !== "";
    });
    const eskiNot = typeof kayit.beslenme === "string" && kayit.beslenme.trim() !== "";
    const eskiBakim = !!kayit.sabahBakim || !!kayit.aksamBakim;
    const ogunVar = kayit.ogunler.length > 0;
    const sporVar = kayit.sporlar.length > 0;
    const bakimVar = [...kayit.rutin.sabah, ...kayit.rutin.aksam]
        .some(x => x.tamamlandi || x.ozel === true || x.gizli === true || x.gunlukDegisti === true);
    return !(alanDolu || eskiNot || eskiBakim || ogunVar || sporVar || bakimVar);
}

function saglikGunuKaydet(bosUyari = false) {
    if (!saglikVerisiOkunabilir || !saglikTarih.value) return false;
    if (!saglikForm.reportValidity()) return false;
    const kayit = gunlukBilgileriDerle();
    if (gunlukBosMu(kayit)) {
        if (bosUyari) alert("Kaydetmek için en az bir bilgi gir.");
        return false;
    }
    const tarih = saglikTarih.value;
    const yeniKayitlar = { ...saglikKayitlari, [tarih]: kayit };
    if (!saglikDepola(saglikAnahtar, yeniKayitlar)) return false;
    saglikKayitlari = yeniKayitlar;
    saglikSil.disabled = false;
    return true;
}

// Ogun listesini saate gore goster
function ogunleriGoster() {
    const liste = document.getElementById("ogun-listesi");
    liste.replaceChildren();
    const sirali = [...gunlukOgunler].sort((a, b) => a.saat.localeCompare(b.saat));
    sirali.forEach(function(ogun) {
        const satir = document.createElement("div");
        satir.className = "saglik-liste-satir";
        const saat = document.createElement("span");
        saat.className = "saglik-saat";
        saat.textContent = ogun.saat;
        const metin = document.createElement("span");
        metin.className = "saglik-liste-metin";
        metin.textContent = ogun.metin + (ogun.kalori !== null && ogun.kalori !== undefined && ogun.kalori !== "" ? " · " + ogun.kalori + " kcal" : "");
        const duzenle = document.createElement("button");
        duzenle.type = "button";
        duzenle.className = "saglik-satir-buton";
        duzenle.textContent = "✏️";
        duzenle.setAttribute("aria-label", "Öğünü düzenle");
        duzenle.addEventListener("click", function() {
            duzenlenenOgunId = ogun.id;
            document.getElementById("ogun-saat").value = ogun.saat;
            document.getElementById("ogun-yemek").value = ogun.metin;
            document.getElementById("ogun-kalori").value = ogun.kalori ?? "";
            document.getElementById("ogun-ekle").textContent = "Değişikliği Kaydet";
            document.getElementById("ogun-iptal").hidden = false;
        });
        const sil = document.createElement("button");
        sil.type = "button";
        sil.className = "saglik-satir-buton";
        sil.textContent = "🗑️";
        sil.setAttribute("aria-label", "Öğünü sil");
        sil.addEventListener("click", function() {
            const eskiler = gunlukOgunler;
            gunlukOgunler = eskiler.filter(x => x.id !== ogun.id);
            if (saglikGunuKaydet()) {
                ogunDuzenlemeyiSifirla();
                ogunleriGoster();
            } else {
                gunlukOgunler = eskiler;
            }
        });
        satir.append(saat, metin, duzenle, sil);
        liste.appendChild(satir);
    });
    kaKaloriToplaminiGoster();
}

function ogunDuzenlemeyiSifirla() {
    duzenlenenOgunId = null;
    document.getElementById("ogun-saat").value = "";
    document.getElementById("ogun-yemek").value = "";
    document.getElementById("ogun-kalori").value = "";
    document.getElementById("ogun-ekle").textContent = "+ Öğün Ekle";
    document.getElementById("ogun-iptal").hidden = true;
}

document.getElementById("ogun-ekle").addEventListener("click", function() {
    const saat = document.getElementById("ogun-saat").value;
    const metin = document.getElementById("ogun-yemek").value.trim();
    const kaloriHam = document.getElementById("ogun-kalori").value;
    const kalori = kaloriHam === "" ? null : Number(kaloriHam);
    if (kalori !== null && (!Number.isFinite(kalori) || kalori < 0 || kalori > 20000)) {
        alert("Kalori bilgisini kontrol et.");
        return;
    }
    if (!saat || !metin) {
        alert("Öğün için saat ve yemek bilgisini gir.");
        return;
    }
    const eskiler = gunlukOgunler;
    if (duzenlenenOgunId !== null) {
        gunlukOgunler = eskiler.map(x => x.id === duzenlenenOgunId
            ? { ...x, saat, metin, kalori } : x);
    } else {
        gunlukOgunler = [...eskiler, { id: crypto.randomUUID(), saat, metin, kalori }];
    }
    if (saglikGunuKaydet()) {
        ogunDuzenlemeyiSifirla();
        ogunleriGoster();
        saglikDurum.textContent = "Öğün kaydedildi. 💗";
    } else {
        gunlukOgunler = eskiler;
    }
});

document.getElementById("ogun-iptal").addEventListener("click", ogunDuzenlemeyiSifirla);

// Sporlar sadece Spor Ekle dugmesiyle kaydedilir
function sporAlanlariniTemizle() {
    duzenlenenSporId = null;
    document.getElementById("spor-tur").value = "";
    document.getElementById("spor-sure").value = "";
    document.getElementById("spor-kalori").value = "";
    document.getElementById("spor-ekle").textContent = "+ Spor Ekle";
    document.getElementById("spor-iptal").hidden = true;
}

function sporlariGoster() {
    const liste = document.getElementById("spor-listesi");
    liste.replaceChildren();
    gunlukSporlar.forEach(function(spor) {
        const satir = document.createElement("div");
        satir.className = "saglik-liste-satir";
        const metin = document.createElement("span");
        metin.className = "saglik-liste-metin";
        const secenek = document.querySelector('#spor-tur option[value="' + spor.tur + '"]');
        const ad = secenek ? secenek.textContent : spor.tur;
        metin.textContent = ad + " · " + spor.sure + " dk" +
            (spor.kalori !== null ? " · Tahmini " + spor.kalori + " kcal" : "");
        const duzenle = document.createElement("button");
        duzenle.type = "button";
        duzenle.className = "saglik-satir-buton";
        duzenle.textContent = "✏️";
        duzenle.setAttribute("aria-label", "Sporu düzenle");
        duzenle.addEventListener("click", function() {
            duzenlenenSporId = spor.id;
            document.getElementById("spor-tur").value = spor.tur;
            document.getElementById("spor-sure").value = spor.sure;
            document.getElementById("spor-kalori").value = spor.kalori ?? "";
            document.getElementById("spor-ekle").textContent = "Değişikliği Kaydet";
            document.getElementById("spor-iptal").hidden = false;
        });
        const sil = document.createElement("button");
        sil.type = "button";
        sil.className = "saglik-satir-buton";
        sil.textContent = "🗑️";
        sil.setAttribute("aria-label", "Sporu sil");
        sil.addEventListener("click", function() {
            const eski = gunlukSporlar;
            gunlukSporlar = eski.filter(x => x.id !== spor.id);
            if (saglikGunuKaydet()) {
                sporAlanlariniTemizle();
                sporlariGoster();
            } else gunlukSporlar = eski;
        });
        satir.append(metin, duzenle, sil);
        liste.appendChild(satir);
    });
    const toplam = gunlukSporlar.reduce((sonuc, spor) => sonuc + Number(spor.sure), 0);
    document.getElementById("spor-toplam").textContent = gunlukSporlar.length
        ? gunlukSporlar.length + " spor · Toplam " + toplam + " dakika"
        : "Henüz spor eklenmedi.";
}

document.getElementById("spor-ekle").addEventListener("click", function() {
    const tur = document.getElementById("spor-tur").value;
    const sureAlani = document.getElementById("spor-sure");
    const kaloriAlani = document.getElementById("spor-kalori");
    const sure = Number(sureAlani.value);
    const kalori = kaloriAlani.value === "" ? null : Number(kaloriAlani.value);
    if (!tur || !sureAlani.value || !Number.isInteger(sure) || sure < 1 || sure > 1440 ||
        (kalori !== null && (!Number.isFinite(kalori) || kalori < 0 || kalori > 20000))) {
        alert("Spor türü ve geçerli süre gir; enerji alanı isteğe bağlıdır.");
        return;
    }
    const eski = gunlukSporlar;
    const yeni = { id: duzenlenenSporId || crypto.randomUUID(), tur, sure, kalori };
    gunlukSporlar = duzenlenenSporId
        ? eski.map(x => x.id === duzenlenenSporId ? yeni : x)
        : [...eski, yeni];
    if (saglikGunuKaydet()) {
        sporAlanlariniTemizle();
        sporlariGoster();
        saglikDurum.textContent = "Spor kaydedildi. 💗";
    } else gunlukSporlar = eski;
});

document.getElementById("spor-iptal").addEventListener("click", sporAlanlariniTemizle);

// Gunluk bakim adimlari sadece secili tarihte degisir
let duzenlenenGunlukBakim = null;

function gunlukBakimFormunuTemizle() {
    duzenlenenGunlukBakim = null;
    document.getElementById("gunluk-bakim-metin").value = "";
    document.getElementById("gunluk-bakim-ekle").textContent = "+ Günlük Bakım Ekle";
    document.getElementById("gunluk-bakim-iptal").hidden = true;
    document.getElementById("gunluk-bakim-zaman").disabled = false;
}

function gunlukBakimDurumuYaz(metin) {
    document.getElementById("gunluk-bakim-durum").textContent = metin;
}

// Sabah ve aksam rutinlerini tik listeleri olarak goster
function rutinleriGoster() {
    ["sabah", "aksam"].forEach(function(zaman) {
        const liste = document.getElementById(zaman + "-rutin-listesi");
        liste.replaceChildren();
        gunlukRutin[zaman].filter(x => x.gizli !== true).forEach(function(adim) {
            const satir = document.createElement("div");
            satir.className = "saglik-liste-satir";
            const tik = document.createElement("input");
            tik.type = "checkbox";
            tik.className = "rutin-tik";
            tik.checked = adim.tamamlandi === true;
            tik.setAttribute("aria-label", adim.metin);
            const metin = document.createElement("span");
            metin.className = "saglik-liste-metin";
            metin.textContent = adim.metin;
            if (tik.checked) metin.classList.add("tamamlandi");
            tik.addEventListener("change", function() {
                const eski = adim.tamamlandi;
                adim.tamamlandi = tik.checked;
                if (saglikGunuKaydet()) {
                    rutinleriGoster();
                } else {
                    adim.tamamlandi = eski;
                    tik.checked = eski;
                }
            });
            const duzenle = document.createElement("button");
            duzenle.type = "button";
            duzenle.className = "saglik-satir-buton";
            duzenle.textContent = "✏️";
            duzenle.setAttribute("aria-label", adim.metin + " adımını yalnızca bu gün için düzenle");
            duzenle.addEventListener("click", function() {
                duzenlenenGunlukBakim = { zaman, id: adim.id };
                document.getElementById("gunluk-bakim-zaman").value = zaman;
                document.getElementById("gunluk-bakim-zaman").disabled = true;
                document.getElementById("gunluk-bakim-metin").value = adim.metin;
                document.getElementById("gunluk-bakim-ekle").textContent = "Değişikliği Kaydet";
                document.getElementById("gunluk-bakim-iptal").hidden = false;
                document.getElementById("gunluk-bakim-metin").focus();
            });
            const sil = document.createElement("button");
            sil.type = "button";
            sil.className = "saglik-satir-buton";
            sil.textContent = "🗑️";
            sil.setAttribute("aria-label", adim.metin + " adımını yalnızca bu günden kaldır");
            sil.addEventListener("click", function() {
                if (!confirm("Bu bakım adımı yalnızca seçili günden kaldırılsın mı?")) return;
                const onceki = gunlukRutin[zaman];
                gunlukRutin[zaman] = adim.ozel === true
                    ? onceki.filter(x => x.id !== adim.id)
                    : onceki.map(x => x.id === adim.id ? { ...x, gizli: true } : x);
                if (saglikGunuKaydet()) {
                    gunlukBakimFormunuTemizle();
                    rutinleriGoster();
                    gunlukBakimDurumuYaz("Adım yalnızca bu günden kaldırıldı.");
                } else {
                    gunlukRutin[zaman] = onceki;
                }
            });
            satir.append(tik, metin, duzenle, sil);
            liste.appendChild(satir);
        });
    });
}

document.getElementById("gunluk-bakim-ekle").addEventListener("click", function() {
    const alan = document.getElementById("gunluk-bakim-metin");
    const metin = alan.value.trim();
    const zaman = duzenlenenGunlukBakim
        ? duzenlenenGunlukBakim.zaman
        : document.getElementById("gunluk-bakim-zaman").value;
    if (!metin || metin.length > 100) {
        alert("1 ile 100 karakter arasında bakım adımı yaz.");
        return;
    }
    const onceki = gunlukRutin[zaman];
    if (duzenlenenGunlukBakim) {
        gunlukRutin[zaman] = onceki.map(x => x.id === duzenlenenGunlukBakim.id
            ? { ...x, metin, gunlukDegisti: true } : x);
    } else {
        gunlukRutin[zaman] = [...onceki, {
            id: crypto.randomUUID(), metin, tamamlandi: false, ozel: true
        }];
    }
    if (saglikGunuKaydet()) {
        gunlukBakimFormunuTemizle();
        rutinleriGoster();
        gunlukBakimDurumuYaz("Bakım adımı yalnızca seçili güne kaydedildi. 💗");
    } else {
        gunlukRutin[zaman] = onceki;
    }
});

document.getElementById("gunluk-bakim-iptal").addEventListener("click", gunlukBakimFormunuTemizle);

// Profil sablonu degisirken bugune ozel duzenlemeleri koru
function bugununRutininiEsitle() {
    if (saglikTarih.value !== tarihAnahtari(new Date())) return;
    ["sabah", "aksam"].forEach(function(zaman) {
        const onceki = gunlukRutin[zaman];
        const sablon = bakimRutini[zaman].map(function(adim) {
            const bulunan = onceki.find(x => x.id === adim.id);
            return bulunan ? {
                ...adim,
                ...bulunan,
                metin: bulunan.gunlukDegisti === true ? bulunan.metin : adim.metin,
                tamamlandi: bulunan.tamamlandi === true
            } : { ...adim, tamamlandi: false };
        });
        const ozelAdimlar = onceki.filter(x => x.ozel === true);
        gunlukRutin[zaman] = [...sablon, ...ozelAdimlar];
    });
    if (saglikKayitlari[saglikTarih.value]) saglikGunuKaydet();
    rutinleriGoster();
}

function profilRutinAyarlariniKur() {
    const profilSayfasi = document.getElementById("profil");
    if (!profilSayfasi) return;
    const kart = document.createElement("div");
    kart.className = "saglik-profil-ayar-kart";
    kart.id = "profil-rutin-ayarlari";
    kart.innerHTML = `<h3>⚙️ Ayarlar</h3>
        <h4>✨ Cilt Bakım Rutinimi Düzenle</h4>
        <p>Burada tanımladığın sabah ve akşam rutinleri Sağlık sayfasında her gün görünür.</p>
        <div class="saglik-profil-rutin-kutu"><h4>☀️ Sabah Rutinim</h4><div id="profil-sabah-liste"></div></div>
        <div class="saglik-profil-rutin-kutu"><h4>🌙 Akşam Rutinim</h4><div id="profil-aksam-liste"></div></div>
        <label for="profil-rutin-zaman">Hangi rutin?</label>
        <select id="profil-rutin-zaman"><option value="sabah">Sabah</option><option value="aksam">Akşam</option></select>
        <label for="profil-rutin-adim">Yeni bakım adımı</label>
        <input id="profil-rutin-adim" maxlength="100" placeholder="Örn: Nemlendirici">
        <button type="button" id="profil-rutin-ekle">+ Bakım Adımı Ekle</button>
        <p id="profil-rutin-durum" role="status"></p>`;
    profilSayfasi.appendChild(kart);
    document.getElementById("profil-rutin-ekle").addEventListener("click", function() {
        const zaman = document.getElementById("profil-rutin-zaman").value;
        const alan = document.getElementById("profil-rutin-adim");
        const metin = alan.value.trim();
        if (!metin || metin.length > 100) {
            alert("1 ile 100 karakter arasında bakım adımı yaz.");
            return;
        }
        const yeni = { ...bakimRutini,
            [zaman]: [...bakimRutini[zaman], { id: crypto.randomUUID(), metin }] };
        if (saglikDepola(rutinAnahtar, yeni)) {
            bakimRutini = yeni;
            alan.value = "";
            profilRutinleriGoster();
            bugununRutininiEsitle();
        }
    });
    profilRutinleriGoster();
}

function profilRutinleriGoster() {
    ["sabah", "aksam"].forEach(function(zaman) {
        const liste = document.getElementById("profil-" + zaman + "-liste");
        liste.replaceChildren();
        bakimRutini[zaman].forEach(function(adim) {
            const satir = document.createElement("div");
            satir.className = "saglik-profil-rutin-satir";
            const metin = document.createElement("span");
            metin.textContent = adim.metin;
            const duzenle = document.createElement("button");
            duzenle.type = "button";
            duzenle.textContent = "✏️";
            duzenle.setAttribute("aria-label", "Adımı düzenle");
            duzenle.addEventListener("click", function() {
                const cevap = prompt("Bakım adımını düzenle:", adim.metin);
                if (cevap === null) return;
                const temiz = cevap.trim();
                if (!temiz || temiz.length > 100) return;
                rutinSablonuKaydet(zaman, adim.id, temiz, false);
            });
            const sil = document.createElement("button");
            sil.type = "button";
            sil.textContent = "🗑️";
            sil.setAttribute("aria-label", "Adımı sil");
            sil.addEventListener("click", function() {
                if (confirm("Bu adımı rutinden kaldırmak istiyor musun?")) {
                    rutinSablonuKaydet(zaman, adim.id, "", true);
                }
            });
            satir.append(metin, duzenle, sil);
            liste.appendChild(satir);
        });
    });
}

function rutinSablonuKaydet(zaman, id, metin, sil) {
    const yeni = { ...bakimRutini,
        [zaman]: bakimRutini[zaman].filter(x => !(sil && x.id === id))
            .map(x => x.id === id ? { ...x, metin } : x) };
    if (saglikDepola(rutinAnahtar, yeni)) {
        bakimRutini = yeni;
        profilRutinleriGoster();
        bugununRutininiEsitle();
        document.getElementById("profil-rutin-durum").textContent =
            "Rutin güncellendi. Geçmiş günlük kayıtlar korunuyor.";
    }
}

document.getElementById("rutin-profile-git").addEventListener("click", function() {
    const menu = document.querySelector('.alt-menu button[data-sayfa="profil"]');
    if (menu) {
        menu.click();
        kaProfilAyarlariAc("profil-rutin-ayarlari");
    }
});

profilRutinAyarlariniKur();

// Gun degistiginde secilen gune ait verileri yeniden yukle
function saglikKaydiniGoster() {
    const kayit = mevcutGunKaydi();
    Object.entries(saglikAlanlari).forEach(function([anahtar, id]) {
        document.getElementById(id).value = kayit[anahtar] ?? "";
    });
    gunlukOgunler = Array.isArray(kayit.ogunler)
        ? kayit.ogunler.map(x => ({ ...x })) : [];
    gunlukSporlar = Array.isArray(kayit.sporlar)
        ? kayit.sporlar.map(x => ({ ...x }))
        : kayit.sporTur && Number(kayit.sporSure) > 0
            ? [{ id: "eski-spor-" + saglikTarih.value, tur: kayit.sporTur,
                sure: Number(kayit.sporSure), kalori: kayit.sporKalori ?? null }]
            : [];
    gunlukRutin = kayit.rutin && Array.isArray(kayit.rutin.sabah) &&
        Array.isArray(kayit.rutin.aksam)
        ? { sabah: kayit.rutin.sabah.map(x => ({ ...x })),
            aksam: kayit.rutin.aksam.map(x => ({ ...x })) }
        : rutinKopyala(bakimRutini);

    const eskiNot = document.getElementById("eski-ogun-notu");
    eskiNot.hidden = !kayit.beslenme;
    eskiNot.textContent = kayit.beslenme ? "Eski beslenme notun: " + kayit.beslenme : "";
    if (kayit.sabahBakim || kayit.aksamBakim) {
        saglikDurum.textContent = "Önceki bakım kaydın da saklanıyor. Yeni rutin tiklerini ayrıca kullanabilirsin.";
    } else {
        saglikDurum.textContent = saglikKayitlari[saglikTarih.value]
            ? "🌿 Bu güne ait kayıt yüklendi." : "Bu güne ait kayıt bulunmuyor.";
    }
    gunlukBakimFormunuTemizle();
    gunlukBakimDurumuYaz("");
    ogunDuzenlemeyiSifirla();
    ogunleriGoster();
    sporAlanlariniTemizle();
    sporlariGoster();
    rutinleriGoster();
    saglikSil.disabled = !saglikKayitlari[saglikTarih.value] || !saglikVerisiOkunabilir;
}

saglikForm.addEventListener("submit", function(event) {
    event.preventDefault();
    if (saglikGunuKaydet(true)) {
        saglikDurum.textContent = "💗 Günlük kaydın kaydedildi.";
    }
});

saglikTarih.addEventListener("change", saglikKaydiniGoster);

saglikSil.addEventListener("click", function() {
    const tarih = saglikTarih.value;
    if (!saglikKayitlari[tarih] || !confirm("Bu güne ait sağlık kaydını silmek istiyor musun?")) return;
    const yenileri = { ...saglikKayitlari };
    delete yenileri[tarih];
    if (saglikDepola(saglikAnahtar, yenileri)) {
        saglikKayitlari = yenileri;
        saglikKaydiniGoster();
        saglikDurum.textContent = "Günlük kayıt silindi.";
    }
});

saglikTarih.value = tarihAnahtari(new Date());
if (!saglikVerisiOkunabilir) {
    saglikForm.querySelectorAll("input, textarea, select, button").forEach(x => x.disabled = true);
}
saglikKaydiniGoster();

// BUTCE V2 - HESAP BAZLI FINANS TAKIBI
const BV_HESAPLAR = "kendimeAlanHesaplar";
const BV_KAYNAKLAR = "kendimeAlanGelirKaynaklari";
const BV_ISLEMLER = "kendimeAlanButceV2";
const BV_HEDEFLER = "kendimeAlanButceHedefleri";
const bvEl = id => document.getElementById(id);
const bvBugun = () => tarihAnahtari(new Date());
const bvKimlik = () => crypto.randomUUID();
const bvPara = deger => Number(deger || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
const bvYuvarla = deger => Math.round((Number(deger) + Number.EPSILON) * 100) / 100;
const bvKayitOku = (anahtar, varsayilan) => {
    const ham = localStorage.getItem(anahtar);
    if (ham === null) return varsayilan;
    const deger = JSON.parse(ham);
    if (Array.isArray(varsayilan) ? !Array.isArray(deger) : (!deger || Array.isArray(deger) || typeof deger !== "object")) {
        throw new Error("Gecersiz kayit: " + anahtar);
    }
    return deger;
};
let bvHesaplar = [];
let bvKaynaklar = [];
let bvIslemler = [];
let bvHedefler = {};
let bvDuzenlenenHesap = null;
let bvDuzenlenenKaynak = null;
let bvDuzenlenenIslem = null;
let bvGorunum = "gun";
let bvOdakTarih = bvBugun();
let bvSeciliHesap = "";
let bvKullanilabilir = true;
const bvKategoriler = {
    gelir: ["Harçlık", "Maaş", "Burs", "Kira Geliri", "Hediye", "Ek Gelir", "Diğer"],
    gider: ["Yeme & İçme", "Market", "Ulaşım", "Alışveriş", "Eğitim", "Sağlık & Bakım", "Faturalar", "Eğlence", "Diğer"]
};

// Bakiyeler her zaman islemlerden tekrar hesaplanir.
function bvHesapHareketleri(islemler, tarihSiniri = bvBugun()) {
    const sonuc = {};
    function hesap(id) {
        if (!sonuc[id]) sonuc[id] = { gelen: 0, giden: 0, birikime: 0, birikim: 0, bakiye: 0 };
        return sonuc[id];
    }
    [...islemler].filter(x => x.tarih <= tarihSiniri).sort((a,b) => a.tarih.localeCompare(b.tarih)).forEach(x => {
        const tutar = Number(x.tutar);
        if (!Number.isFinite(tutar)) return;
        const h = hesap(x.hesapId);
        if (x.tur === "gelir") { h.gelen += tutar; h.bakiye += tutar; }
        if (x.tur === "gider") { h.giden += tutar; h.bakiye -= tutar; }
        if (x.tur === "birikim") { h.birikime += tutar; h.birikim += tutar; h.bakiye -= tutar; }
        if (x.tur === "birikim-iade") { h.birikime -= tutar; h.birikim -= tutar; h.bakiye += tutar; }
        if (x.tur === "transfer") { h.bakiye -= tutar; hesap(x.hedefHesapId).bakiye += tutar; }
    });
    Object.values(sonuc).forEach(h => Object.keys(h).forEach(k => h[k] = bvYuvarla(h[k])));
    return sonuc;
}
function bvTarihAraligi() {
    const [y,m,d] = bvOdakTarih.split("-").map(Number);
    const bas = new Date(y, m - 1, d);
    let son = new Date(bas);
    if (bvGorunum === "hafta") {
        bas.setDate(bas.getDate() - (bas.getDay() + 6) % 7);
        son = new Date(bas);
        son.setDate(son.getDate() + 6);
    }
    if (bvGorunum === "ay") {
        bas.setDate(1);
        son = new Date(y, m, 0);
    }
    return [tarihAnahtari(bas), tarihAnahtari(son)];
}
function bvDonemIslemleri() {
    const [bas,son] = bvTarihAraligi();
    return bvIslemler.filter(x => x.tarih >= bas && x.tarih <= son);
}
function bvHesapAdi(id) {
    const h = bvHesaplar.find(x => x.id === id);
    return h ? h.ad : "Silinmiş hesap";
}
function bvKaydet(anahtar, veri) {
    if (!bvKullanilabilir) return false;
    try { localStorage.setItem(anahtar, JSON.stringify(veri)); return true; }
    catch (hata) { console.error(hata); alert("Kayıt yapılamadı. Depolama alanını kontrol et."); return false; }
}
function bvEskiKayitlariHazirla() {
    if (localStorage.getItem(BV_ISLEMLER) !== null) return;
    const eskiler = bvKayitOku("kendimeAlanIslemler", []);
    if (!eskiler.length) return;
    const eskiHesap = { id: "bv-eski-kayitlar", ad: "Eski Kayıtlar" };
    const hesaplar = bvHesaplar.some(x => x.id === eskiHesap.id) ? bvHesaplar : [...bvHesaplar, eskiHesap];
    const aktarilan = eskiler.filter(x => x && ["gelir", "gider"].includes(x.tur)).map(x => ({
        id: "bv-eski-" + String(x.id || bvKimlik()),
        tur: x.tur, tutar: Number(x.tutar), tarih: x.tarih,
        hesapId: eskiHesap.id, kategori: x.kategori || "Diğer", aciklama: x.aciklama || "",
        eskiKayit: true
    }));
    if (bvKaydet(BV_HESAPLAR, hesaplar) && bvKaydet(BV_ISLEMLER, aktarilan)) {
        bvHesaplar = hesaplar;
        bvIslemler = aktarilan;
    }
}
try {
    bvHesaplar = bvKayitOku(BV_HESAPLAR, []);
    bvKaynaklar = bvKayitOku(BV_KAYNAKLAR, []);
    bvIslemler = bvKayitOku(BV_ISLEMLER, []);
    bvHedefler = bvKayitOku(BV_HEDEFLER, {});
    bvEskiKayitlariHazirla();
} catch (hata) {
    bvKullanilabilir = false;
    console.error("Butce kayitlari okunamadi:", hata);
    alert("Bütçe kayıtları okunamadı. Eski verilerini silme; yedeğini koru.");
}

function bvHesapSecenekleri() {
    ["bv-kaynak-hesap", "bv-islem-hesap", "bv-hedef-hesap", "bv-filtre-hesap"].forEach(id => {
        const alan = bvEl(id);
        const secili = alan.value;
        alan.replaceChildren();
        const varsayilan = document.createElement("option");
        varsayilan.value = "";
        varsayilan.textContent = id === "bv-filtre-hesap" ? "Tüm hesaplar" : "Hesap seç";
        alan.appendChild(varsayilan);
        bvHesaplar.forEach(h => {
            const o = document.createElement("option");
            o.value = h.id; o.textContent = h.ad; alan.appendChild(o);
        });
        if (bvHesaplar.some(h => h.id === secili)) alan.value = secili;
    });
}
function bvDonemMetni() {
    const [bas,son] = bvTarihAraligi();
    const t = metin => new Date(metin + "T12:00:00").toLocaleDateString("tr-TR", { day:"numeric", month:"short", year:"numeric" });
    return bas === son ? t(bas) : t(bas) + " – " + t(son);
}
function bvOzetGoster() {
    const donem = bvDonemIslemleri();
    const toplam = tur => bvYuvarla(donem.filter(x => x.tur === tur).reduce((s,x) => s + Number(x.tutar), 0));
    const hareket = bvHesapHareketleri(bvIslemler);
    const tum = Object.values(hareket);
    bvEl("bv-toplam-gelir").textContent = bvPara(toplam("gelir"));
    bvEl("bv-toplam-gider").textContent = bvPara(toplam("gider"));
    bvEl("bv-donem-birikim").textContent = bvPara(toplam("birikim") - toplam("birikim-iade"));
    const donemKalan = toplam("gelir") - toplam("gider")
    - (toplam("birikim") - toplam("birikim-iade"));

bvEl("bv-donem-kalan").textContent = bvPara(donemKalan);
    bvEl("bv-toplam-birikim").textContent = bvPara(tum.reduce((s,h) => s + h.birikim,0));
    bvEl("bv-kullanilabilir").textContent = bvPara(tum.reduce((s,h) => s + h.bakiye,0));
    bvEl("bv-donem-baslik").textContent = bvDonemMetni();
    // Gunluk gorunumde donem ozetini gizle
const ozetKartlari = document.querySelector(".ka-butce-yeni-ozet");
const genelBilgi = document.querySelector(".ka-butce-genel-bilgi");

const ozetGosterilsin = bvGorunum !== "gun";

if (ozetKartlari) {
    ozetKartlari.hidden = !ozetGosterilsin;
}

if (genelBilgi) {
    genelBilgi.hidden = !ozetGosterilsin;
}
    bvEl("bv-tarih").value = bvOdakTarih;
    document.querySelectorAll("[data-bv-gorunum]").forEach(b => b.classList.toggle("bv-sekme-aktif", b.dataset.bvGorunum === bvGorunum));
    // Haftalik ve aylik gorunumde ekleme alanlarini gizle
const gunlukMu = bvGorunum === "gun";

["bv-hesap-form", "bv-hedef-form"].forEach(function(id) {
    const form = document.getElementById(id);

    if (form) {
        form.hidden = !gunlukMu;
    }
});

const islemFormu = document.getElementById("bv-islem-form");

if (islemFormu) {
    const islemKarti = islemFormu.closest("details, .butce-kart");

    if (islemKarti) {
        islemKarti.hidden = !gunlukMu;
    }
}
}
function bvSatirOlustur(baslik, alt, butonlar = []) {
    const satir = document.createElement("div"); satir.className = "bv-satir";
    const metin = document.createElement("div"); metin.className = "bv-satir-icerik";
    const ust = document.createElement("strong"); ust.textContent = baslik;
    const altSatir = document.createElement("small"); altSatir.textContent = alt;
    metin.append(ust, altSatir); satir.appendChild(metin);
    butonlar.forEach(({yazi, tik, etiket}) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "bv-kucuk-buton";
        b.textContent = yazi; b.setAttribute("aria-label", etiket || yazi);
        b.addEventListener("click", tik); satir.appendChild(b);
    });
    return satir;
}
function bvHesaplariGoster() {
    const kutu = bvEl("bv-hesap-kartlari"); kutu.replaceChildren();
    const durum = bvHesapHareketleri(bvIslemler);
    const donem = bvDonemIslemleri();
    if (!bvHesaplar.length) kutu.textContent = "Başlamak için ilk hesabını ekle.";
    bvHesaplar.forEach(h => {
        const gecmis = durum[h.id] || {gelen:0,giden:0,birikime:0,bakiye:0,birikim:0};
        const kart = document.createElement("div"); kart.className = "bv-hesap-kart";
        if (bvSeciliHesap === h.id) kart.classList.add("bv-hesap-secili");
        const baslik = document.createElement("h4"); baslik.textContent = "💳 " + h.ad;
        const bakiye = document.createElement("strong"); bakiye.textContent = bvPara(gecmis.bakiye);
        const detay = document.createElement("p");
        const ilgili = donem.filter(x => x.hesapId === h.id);
        const turToplam = tur => ilgili.filter(x => x.tur === tur).reduce((s,x)=>s+Number(x.tutar),0);
        detay.textContent = "Dönem: +" + bvPara(turToplam("gelir")) + " gelir · " + bvPara(turToplam("gider")) + " gider · " + bvPara(turToplam("birikim") - turToplam("birikim-iade")) + " birikim";
        const toplamlar = document.createElement("small");
        toplamlar.textContent = "Bugüne kadar gelen: " + bvPara(gecmis.gelen) + " · Harcama: " + bvPara(gecmis.giden) + " · Birikime ayrılan (net): " + bvPara(gecmis.birikime);
        const dugmeler = document.createElement("div"); dugmeler.className = "bv-kart-butonlar";
        const filtre = document.createElement("button"); filtre.type="button";
        filtre.textContent = bvSeciliHesap === h.id ? "Filtreyi Kaldır" : "İşlemleri Gör";
        filtre.addEventListener("click", () => { bvSeciliHesap = bvSeciliHesap === h.id ? "" : h.id; bvEl("bv-filtre-hesap").value=bvSeciliHesap; bvYenile(); });
        const duzenle = document.createElement("button"); duzenle.type="button"; duzenle.textContent="✏️ Adı Değiştir";
        duzenle.addEventListener("click", () => { bvDuzenlenenHesap=h.id; bvEl("bv-hesap-ad").value=h.ad; bvEl("bv-hesap-form-baslik").textContent="Hesap Adını Değiştir"; bvEl("bv-hesap-iptal").hidden=false; bvEl("bv-hesap-ad").focus(); });
        const sil = document.createElement("button"); sil.type="button"; sil.textContent="🗑️"; sil.title="Hesabı sil";
        sil.addEventListener("click", () => {
            if (bvIslemler.some(x => x.hesapId===h.id || x.hedefHesapId===h.id) || bvKaynaklar.some(x=>x.hesapId===h.id)) {
                alert("Bu hesaba bağlı işlem veya gelir kaynağı var. Kayıtları korumak için hesap silinemez."); return;
            }
            if (!confirm("Boş hesabı silmek istiyor musun?")) return;
            const yeni=bvHesaplar.filter(x=>x.id!==h.id);
            if (bvKaydet(BV_HESAPLAR,yeni)) {bvHesaplar=yeni;bvSeciliHesap="";bvYenile();}
        });
        const bagliKaynaklar = bvKaynaklar.filter(k => k.hesapId === h.id);
        const kaynakBilgisi = document.createElement("div");
        kaynakBilgisi.className = "bv-hesap-kaynaklar";
        if (bagliKaynaklar.length) {
            const kaynakBaslik = document.createElement("strong");
            kaynakBaslik.textContent = "Bağlı gelir kaynakları";
            kaynakBilgisi.appendChild(kaynakBaslik);
            bagliKaynaklar.forEach(k => {
                const aciklama = document.createElement("p");
                aciklama.textContent = k.ad + " · Beklenen: " + bvPara(k.tutar) +
                    (k.tekrar === "aylik" ? " / ay" : " (tek seferlik)") +
                    " · " + (k.tekrar === "aylik" ? "Ayın " + Number(k.tarih.slice(8)) + ". günü" : k.tarih);
                kaynakBilgisi.appendChild(aciklama);
            });
            const uyari = document.createElement("small");
            uyari.textContent = "Beklenen gelir kullanılabilir bakiyeye dahil değildir.";
            kaynakBilgisi.appendChild(uyari);
        } else {
            kaynakBilgisi.textContent = "Bu hesaba bağlı gelir kaynağı yok.";
        }
        dugmeler.append(filtre,duzenle,sil);
        kart.append(baslik,bakiye,kaynakBilgisi,detay,toplamlar,dugmeler);
        kutu.appendChild(kart);
    });
    bvEl("bv-hesap-filtre-durum").textContent = bvSeciliHesap ? "İşlem geçmişinde " + bvHesapAdi(bvSeciliHesap) + " filtreleniyor." : "";
}
function bvKaynaklarGoster() {
    const liste=bvEl("bv-kaynak-listesi"); liste.replaceChildren();
    if (!bvKaynaklar.length) liste.textContent="Henüz gelir kaynağı eklemedin.";
    bvKaynaklar.forEach(k => {
        const alt=bvPara(k.tutar)+" · "+bvHesapAdi(k.hesapId)+" · "+(k.tekrar==="aylik" ? "Aylık, ayın "+Number(k.tarih.slice(8))+". günü" : "Tek seferlik, "+k.tarih);
        const satir=bvSatirOlustur(k.ad,alt,[
            {yazi:"💗 Geliri Aldım",etiket:"Geliri alındı olarak kaydet",tik:()=>bvKaynakGeliriniKaydet(k)},
            {yazi:"✏️",etiket:"Gelir kaynağını düzenle",tik:()=>{
                bvDuzenlenenKaynak=k.id;
                bvEl("bv-kaynak-ad").value=k.ad; bvEl("bv-kaynak-tutar").value=k.tutar;
                bvEl("bv-kaynak-hesap").value=k.hesapId;bvEl("bv-kaynak-tekrar").value=k.tekrar;
                bvEl("bv-kaynak-tarih").value=k.tarih; bvEl("bv-kaynak-form-baslik").textContent="Gelir Kaynağını Düzenle";bvEl("bv-kaynak-iptal").hidden=false;
                kaProfilGelirAyarlariniAc();
            }},
            {yazi:"🗑️",etiket:"Gelir kaynağını sil",tik:()=>{
                if (!confirm("Gelir kaynağını silmek istiyor musun? Önceden alınmış gelir hareketleri kalır.")) return;
                const yeni=bvKaynaklar.filter(x=>x.id!==k.id);
                if (bvKaydet(BV_KAYNAKLAR,yeni)){bvKaynaklar=yeni;bvYenile();}
            }}
        ]);
        liste.appendChild(satir);
    });
}
function bvKaynakGeliriniKaydet(k) {
    const tarih=prompt("Gelirin GERÇEKTEN hesaba geçtiği tarihi yaz (YYYY-AA-GG):",bvBugun());
    if (tarih===null) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih) || !Number.isFinite(Date.parse(tarih+"T12:00:00")) || tarih>bvBugun()) {
        alert("Bugün veya geçmiş bir tarih gir. Gelecekteki gelir henüz alınmış sayılamaz.");return;
    }
    if (tarih < k.tarih) { alert("Gelir ilk beklenen tarihten önce kaydedilemez. Tarihi gelir kaynağından değiştirebilirsin."); return; }
    const ayni=bvIslemler.some(x=>x.kaynakId===k.id && x.tur==="gelir" &&
        (k.tekrar==="aylik" ? x.tarih.slice(0,7)===tarih.slice(0,7) : x.tarih===tarih));
    if (ayni) { alert("Bu gelir kaynağı için bu dönemde zaten gelir kaydedilmiş."); return; }
    if (k.tekrar==="tek" && bvIslemler.some(x=>x.kaynakId===k.id && x.tur==="gelir")) {
        alert("Tek seferlik gelir daha önce kaydedilmiş.");return;
    }
    if (!confirm(k.ad+" için "+bvPara(k.tutar)+" gerçekten "+bvHesapAdi(k.hesapId)+" hesabına geçti mi?")) return;
    const yeni=[...bvIslemler,{id:bvKimlik(),tur:"gelir",tutar:Number(k.tutar),tarih,hesapId:k.hesapId,kategori:k.ad,aciklama:"Gelir kaynağı: "+k.ad,kaynakId:k.id}];
    if (bvKaydet(BV_ISLEMLER,yeni)){bvIslemler=yeni;bvYenile();}
}
function bvIslemAlanlariniAyarla() {
    const tur=bvEl("bv-islem-tur").value;
    bvEl("bv-hedef-hesap-satir").hidden=tur!=="transfer";
    bvEl("bv-kategori-satir").hidden=!["gelir","gider"].includes(tur);
    bvEl("bv-birikim-ad-satir").hidden=!["birikim","birikim-iade"].includes(tur);
    const onceki=bvEl("bv-islem-kategori").value;
    bvEl("bv-islem-kategori").replaceChildren();
    (bvKategoriler[tur] || []).forEach(ad=>{const o=document.createElement("option");o.value=ad;o.textContent=ad;bvEl("bv-islem-kategori").appendChild(o);});
    if ((bvKategoriler[tur]||[]).includes(onceki)) bvEl("bv-islem-kategori").value=onceki;
}
function bvIslemFormTemizle() {
    bvDuzenlenenIslem=null;bvEl("bv-islem-form").reset();bvEl("bv-islem-tarih").value=bvBugun();
    bvEl("bv-islem-kaydet").textContent="+ İşlem Ekle";bvEl("bv-islem-iptal").hidden=true;bvIslemAlanlariniAyarla();
}
function bvBakiyeKontrolu(yeni, duzenlenenId = null) {
    const onceki=bvIslemler.filter(x=>x.id!==duzenlenenId);
    const tarih=yeni.tarih;
    const hareket=bvHesapHareketleri(onceki,tarih);
    const kalan=(hareket[yeni.hesapId] || {bakiye:0,birikim:0});
    if (["gider","birikim","transfer"].includes(yeni.tur) && kalan.bakiye+0.001 < yeni.tutar) {
        return "Bu hesapta seçilen tarihe kadar yeterli kullanılabilir bakiye yok.";
    }
    if (yeni.tur==="birikim-iade" && kalan.birikim+0.001 < yeni.tutar) {
        return "Bu hesaba bağlı yeterli birikim bulunmuyor.";
    }
    return "";
}
function bvIslemKaydetme(event) {
    event.preventDefault(); if (!bvKullanilabilir) return;
    const tur=bvEl("bv-islem-tur").value;
    const tarih=bvEl("bv-islem-tarih").value;
    const hesapId=bvEl("bv-islem-hesap").value;
    const tutar=bvYuvarla(bvEl("bv-islem-tutar").value);
    const hedefHesapId=bvEl("bv-hedef-hesap").value;
    if (!bvHesaplar.some(x=>x.id===hesapId) || !/^\d{4}-\d{2}-\d{2}$/.test(tarih) || !Number.isFinite(tutar) || tutar<=0) {
        alert("Hesap, tarih ve sıfırdan büyük geçerli tutar gir.");return;
    }
    if (tur==="transfer" && (!hedefHesapId || hesapId===hedefHesapId)) {
        alert("Transfer için farklı bir hedef hesap seç.");return;
    }
    if (tarih>bvBugun()) {alert("İşlem tarihi gelecekte olamaz. Planlı gelirleri Gelir Kaynaklarım bölümünde tutabilirsin.");return;}
    const eski=bvIslemler.find(x=>x.id===bvDuzenlenenIslem);
    const kayit={id:eski?eski.id:bvKimlik(),tur,tutar,tarih,hesapId,
        hedefHesapId:tur==="transfer"?hedefHesapId:undefined,
        kategori:["gelir","gider"].includes(tur)?bvEl("bv-islem-kategori").value:"",
        birikimAdi:["birikim","birikim-iade"].includes(tur)?bvEl("bv-birikim-ad").value.trim() || "Genel Birikim":"",
        aciklama:bvEl("bv-islem-aciklama").value.trim()};
    const hata=bvBakiyeKontrolu(kayit,eski?eski.id:null);
    if (hata){bvEl("bv-islem-mesaj").textContent=hata;alert(hata);return;}
    const yeni=eski?bvIslemler.map(x=>x.id===eski.id?kayit:x):[...bvIslemler,kayit];
    if (bvKaydet(BV_ISLEMLER,yeni)) {
        bvIslemler=yeni;bvIslemFormTemizle();bvEl("bv-islem-mesaj").textContent="💗 İşlem kaydedildi.";bvYenile();
    }
}
function bvIslemleriGoster() {
    const liste=bvEl("bv-islem-listesi");liste.replaceChildren();
    const secilenHesap=bvEl("bv-filtre-hesap").value;
    const tur=bvEl("bv-filtre-tur").value;
    const tum=bvEl("bv-filtre-tarih").value==="tum";
    const [bas,son]=bvTarihAraligi();
    const etiket={gelir:"Gelir",gider:"Gider",birikim:"Birikime ayır", "birikim-iade":"Birikimden geri al",transfer:"Transfer"};
    const secilen=bvIslemler.filter(x=>(!tur||x.tur===tur) && (!secilenHesap||x.hesapId===secilenHesap||x.hedefHesapId===secilenHesap) && (tum||(x.tarih>=bas&&x.tarih<=son)))
        .sort((a,b)=>b.tarih.localeCompare(a.tarih));
    bvEl("bv-bos-islem").hidden=secilen.length>0;
    secilen.forEach(x=>{
        const hedef=x.tur==="transfer"?" → "+bvHesapAdi(x.hedefHesapId):"";
        const detay=x.tarih+" · "+(etiket[x.tur]||x.tur)+" · "+bvHesapAdi(x.hesapId)+hedef+
            (x.kategori?" · "+x.kategori:"")+(x.birikimAdi?" · "+x.birikimAdi:"")+(x.aciklama?" · "+x.aciklama:"");
        const satir=bvSatirOlustur(bvPara(x.tutar),detay,[
            {yazi:"✏️",etiket:"İşlemi düzenle",tik:()=>{
                bvDuzenlenenIslem=x.id;bvEl("bv-islem-tur").value=x.tur;bvIslemAlanlariniAyarla();
                bvEl("bv-islem-tarih").value=x.tarih;bvEl("bv-islem-hesap").value=x.hesapId;
                bvEl("bv-hedef-hesap").value=x.hedefHesapId||"";bvEl("bv-islem-tutar").value=x.tutar;
                bvEl("bv-islem-kategori").value=x.kategori||"";bvEl("bv-birikim-ad").value=x.birikimAdi||"";
                bvEl("bv-islem-aciklama").value=x.aciklama||"";bvEl("bv-islem-kaydet").textContent="Değişikliği Kaydet";
                bvEl("bv-islem-iptal").hidden=false;bvEl("bv-islem-form").scrollIntoView({behavior:"smooth",block:"start"});
            }},
            {yazi:"🗑️",etiket:"İşlemi sil",tik:()=>{
                if(!confirm("Bu işlemi silmek istiyor musun? Hesap bakiyeleri yeniden hesaplanır."))return;
                const yeni=bvIslemler.filter(k=>k.id!==x.id);
                if(bvKaydet(BV_ISLEMLER,yeni)){bvIslemler=yeni;bvIslemFormTemizle();bvYenile();}
            }}
        ]);liste.appendChild(satir);
    });
}
function bvBirikimleriGoster() {
    const alan=bvEl("bv-birikim-hedefleri");alan.replaceChildren();
    const kayitlar=bvIslemler.filter(x=>x.tarih<=bvBugun() && ["birikim","birikim-iade"].includes(x.tur));
    const gruplar={};
    kayitlar.forEach(x=>{const k=x.hesapId+"|"+(x.birikimAdi||"Genel Birikim");gruplar[k]=(gruplar[k]||0)+(x.tur==="birikim"?1:-1)*Number(x.tutar);});
    const girdiler=Object.entries(gruplar);
    if(!girdiler.length)alan.textContent="Henüz birikim kaydın yok.";
    girdiler.forEach(([k,v])=>{const [id,...ad]=k.split("|");alan.appendChild(bvSatirOlustur(ad.join("|"),bvHesapAdi(id)+" · "+bvPara(v)));});
}
function bvHedefGoster() {
    const ay=bvEl("bv-hedef-ay").value;
    const h=bvHedefler[ay]||{};
    bvEl("bv-limit").value=h.limit??"";bvEl("bv-birikim-hedef").value=h.birikim??"";
    const ayIslem=bvIslemler.filter(x=>x.tarih.startsWith(ay));
    const harcama=ayIslem.filter(x=>x.tur==="gider").reduce((s,x)=>s+Number(x.tutar),0);
    bvEl("bv-hedef-mesaj").textContent=h.limit==null?"Henüz aylık bütçe belirlenmedi.":
        "Bu ay harcanan: "+bvPara(harcama)+" · Bütçeden kalan: "+bvPara(Number(h.limit)-harcama)+
        (h.birikim!=null?" · Birikim hedefi: "+bvPara(h.birikim):"");
}
function bvYenile() { bvHesapSecenekleri();if(bvSeciliHesap)bvEl("bv-filtre-hesap").value=bvSeciliHesap;bvOzetGoster();bvHesaplariGoster();bvKaynaklarGoster();kaGelirOzetiniGoster();bvIslemleriGoster();bvBirikimleriGoster();bvHedefGoster(); }

bvEl("bv-hesap-form").addEventListener("submit",e=>{
    e.preventDefault();const ad=bvEl("bv-hesap-ad").value.trim();if(!ad)return;
    if(bvHesaplar.some(x=>x.ad.toLocaleLowerCase("tr-TR")===ad.toLocaleLowerCase("tr-TR")&&x.id!==bvDuzenlenenHesap)) {alert("Bu isimde hesap zaten var.");return;}
    const yeni=bvDuzenlenenHesap?bvHesaplar.map(x=>x.id===bvDuzenlenenHesap?{...x,ad}:x):[...bvHesaplar,{id:bvKimlik(),ad}];
    if(bvKaydet(BV_HESAPLAR,yeni)){bvHesaplar=yeni;bvDuzenlenenHesap=null;bvEl("bv-hesap-form").reset();bvEl("bv-hesap-iptal").hidden=true;bvEl("bv-hesap-form-baslik").textContent="Yeni Hesap Ekle";bvYenile();}
});
bvEl("bv-hesap-iptal").addEventListener("click",()=>{bvDuzenlenenHesap=null;bvEl("bv-hesap-form").reset();bvEl("bv-hesap-iptal").hidden=true;bvEl("bv-hesap-form-baslik").textContent="Yeni Hesap Ekle";});
bvEl("bv-kaynak-form").addEventListener("submit",e=>{
    e.preventDefault();const ad=bvEl("bv-kaynak-ad").value.trim(),tutar=bvYuvarla(bvEl("bv-kaynak-tutar").value);
    const hesapId=bvEl("bv-kaynak-hesap").value,tekrar=bvEl("bv-kaynak-tekrar").value,tarih=bvEl("bv-kaynak-tarih").value;
    if(!ad||!hesapId||!tarih||!Number.isFinite(tutar)||tutar<=0){alert("Gelir kaynağını eksiksiz doldur.");return;}
    const eski=bvKaynaklar.find(x=>x.id===bvDuzenlenenKaynak);
    const kaynak={id:eski?eski.id:bvKimlik(),ad,tutar,hesapId,tekrar,tarih};
    const yeni=eski?bvKaynaklar.map(x=>x.id===eski.id?kaynak:x):[...bvKaynaklar,kaynak];
    if(bvKaydet(BV_KAYNAKLAR,yeni)){bvKaynaklar=yeni;bvDuzenlenenKaynak=null;bvEl("bv-kaynak-form").reset();bvEl("bv-kaynak-tarih").value=bvBugun();bvEl("bv-kaynak-iptal").hidden=true;bvEl("bv-kaynak-form-baslik").textContent="Gelir Kaynağı Ekle";bvYenile();}
});
bvEl("bv-kaynak-iptal").addEventListener("click",()=>{bvDuzenlenenKaynak=null;bvEl("bv-kaynak-form").reset();bvEl("bv-kaynak-iptal").hidden=true;bvEl("bv-kaynak-form-baslik").textContent="Gelir Kaynağı Ekle";});
bvEl("bv-islem-form").addEventListener("submit",bvIslemKaydetme);
bvEl("bv-islem-iptal").addEventListener("click",bvIslemFormTemizle);
bvEl("bv-islem-tur").addEventListener("change",bvIslemAlanlariniAyarla);
bvEl("bv-hedef-form").addEventListener("submit",e=>{
    e.preventDefault();const ay=bvEl("bv-hedef-ay").value;
    const limit=bvEl("bv-limit").value===""?null:Number(bvEl("bv-limit").value);
    const birikim=bvEl("bv-birikim-hedef").value===""?null:Number(bvEl("bv-birikim-hedef").value);
    if(!ay||(limit!==null&&(!Number.isFinite(limit)||limit<0))||(birikim!==null&&(!Number.isFinite(birikim)||birikim<0))){alert("Geçerli hedef tutarları gir.");return;}
    const yeni={...bvHedefler,[ay]:{limit,birikim}};
    if(bvKaydet(BV_HEDEFLER,yeni)){bvHedefler=yeni;bvHedefGoster();}
});
bvEl("bv-hedef-ay").addEventListener("change",bvHedefGoster);
["bv-filtre-tur","bv-filtre-tarih"].forEach(id=>bvEl(id).addEventListener("change",bvIslemleriGoster));
bvEl("bv-filtre-hesap").addEventListener("change",()=>{bvSeciliHesap=bvEl("bv-filtre-hesap").value;bvHesaplariGoster();bvIslemleriGoster();});
document.querySelectorAll("[data-bv-gorunum]").forEach(b=>b.addEventListener("click",()=>{bvGorunum=b.dataset.bvGorunum;bvYenile();}));
bvEl("bv-tarih").addEventListener("change",()=>{if(bvEl("bv-tarih").value){bvOdakTarih=bvEl("bv-tarih").value;bvYenile();}});
bvEl("bv-bugune-git").addEventListener("click",()=>{bvOdakTarih=bvBugun();bvYenile();});
function bvTarihIlerle(yon) {
    const [y,m,d]=bvOdakTarih.split("-").map(Number);const t=new Date(y,m-1,d);
    if(bvGorunum==="gun")t.setDate(t.getDate()+yon);
    if(bvGorunum==="hafta")t.setDate(t.getDate()+7*yon);
    if(bvGorunum==="ay")t.setMonth(t.getMonth()+yon,1);
    bvOdakTarih=tarihAnahtari(t);bvYenile();
}
bvEl("bv-onceki").addEventListener("click",()=>bvTarihIlerle(-1));
bvEl("bv-sonraki").addEventListener("click",()=>bvTarihIlerle(1));
bvEl("bv-kaynak-tarih").value=bvBugun();
bvEl("bv-hedef-ay").value=bvBugun().slice(0,7);
bvIslemFormTemizle();
if (!bvKullanilabilir) bvEl("butce").querySelectorAll("form input, form select, form button").forEach(x=>x.disabled=true);
bvYenile();

// ANA SAYFA GENEL BAKIS SISTEMI

const ozetGorev = document.getElementById("ozet-gorev");
const ozetSu = document.getElementById("ozet-su");
const ozetUyku = document.getElementById("ozet-uyku");
const ozetHarcama = document.getElementById("ozet-harcama");

const anaTarih = document.getElementById("ana-tarih");
const anaSelamlama = document.getElementById("ana-selamlama");
const anaGununNotu = document.getElementById("ana-gunun-notu");
const anaGorevListesi = document.getElementById(
    "ana-gorev-listesi"
);

// Her gun degisen kucuk notlar
const gununNotlari = [
    "Küçük adımlar da ilerlemedir.",
    "Bugün kendin için güzel bir şey yap.",
    "Kendi hızında ilerlemek de değerlidir.",
    "Yeni bir gün, yeni bir başlangıçtır.",
    "Her şeyi bir anda başarmak zorunda değilsin.",
    "Bugünkü emeğin gelecekte sana yardımcı olacak.",
    "Kendine gösterdiğin özen de bir başarıdır.",
    "Bir küçük adım bile fark yaratabilir.",
    "Bugün kendine nazik davran.",
    "Başlamak, ilerlemenin ilk adımıdır.",
    "Dinlenmek de kendine zaman ayırmaktır.",
    "Her gün yeni bir şey öğrenebilirsin.",
    "Küçük mutlulukları fark etmeyi unutma.",
    "Bugün yeni bir fikir keşfedebilirsin.",
    "Kendine ayırdığın zaman değerlidir.",
    "Bir hedefe giden yol küçük adımlarla oluşur.",
    "Bugün güzel bir şeyler seni bekliyor olabilir.",
    "Dününden farklı bir şey denemek yeterli olabilir.",
    "Mükemmel olmak zorunda değilsin.",
    "Her gün aynı enerjide olmak zorunda değilsin.",
    "Kendine güvenmeyi küçük şeylerle öğrenebilirsin.",
    "Bugün bir şeyi tamamlamak güzel hissettirebilir.",
    "Başarı yalnızca büyük sonuçlardan oluşmaz.",
    "Kendin için oluşturduğun bu alan sana ait.",
    "Bugün kendini dinlemek için zaman ayır.",
    "Yeni başlangıçlar küçük kararlarla gelir.",
    "Merak etmek öğrenmenin güzel bir parçasıdır.",
    "Bugün birine gülümsemek bile güzeldir.",
    "Kendi yolunu keşfetmek için zamanın var.",
    "Her deneyim sana yeni bir şey öğretebilir.",
    "Bugün bir an durup güzel şeyleri fark et.",
    "Planların değişebilir, bu çok doğal.",
    "Küçük ilerlemelerini de fark et.",
    "Bugün kendi ritmini takip et.",
    "Yaptığın şeylere biraz sevgi kat."
];

// LocalStorage verilerini oku
function ozetVerisiniOku(anahtar, varsayilan) {
    try {
        const ham = localStorage.getItem(anahtar);

        if (ham === null) {
            return varsayilan;
        }

        const veri = JSON.parse(ham);

        if (Array.isArray(varsayilan)) {
            return Array.isArray(veri) ? veri : varsayilan;
        }

        return (
            veri !== null &&
            typeof veri === "object" &&
            !Array.isArray(veri)
        ) ? veri : varsayilan;

    } catch (hata) {
        console.error("Ozet okunamadi:", anahtar, hata);
        return varsayilan;
    }
}

// Tarihe gore sabit bir gunluk not sec
function gununNotunuSec(tarih) {
    const gunSayisi = Math.floor(
        Date.UTC(
            tarih.getFullYear(),
            tarih.getMonth(),
            tarih.getDate()
        ) / 86400000
    );

    return gununNotlari[
        ((gunSayisi % gununNotlari.length) +
        gununNotlari.length) % gununNotlari.length
    ];
}

// Karsilama ve gunun notunu guncelle
function anaKarsilamayiGuncelle() {
    const simdi = new Date();

    anaTarih.textContent = simdi.toLocaleDateString(
        "tr-TR",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

    const saat = simdi.getHours();

    const selam = saat < 11
        ? "Günaydın"
        : saat < 18
            ? "İyi günler"
            : "İyi akşamlar";

    const profil = ozetVerisiniOku("kendimeAlanProfil", {});
    const ad = typeof profil.ad === "string"
        ? profil.ad.trim()
        : "";

    anaSelamlama.textContent =
        selam + (ad ? ", " + ad : "") + "! 🌷";

    anaGununNotu.textContent = gununNotunuSec(simdi);
}

// Bugunku gorevleri listele
function anaGorevleriGoster(gorevListesiVerisi, bugun) {
    anaGorevListesi.innerHTML = "";

    const bugununGorevleri = gorevListesiVerisi.filter(function(gorev) {
        return gorev && gorev.tarih === bugun;
    });

    const bosMesaj = document.getElementById("ana-bos-gorev");
    const fazlaMesaj = document.getElementById("ana-fazla-gorev");

    bosMesaj.hidden = bugununGorevleri.length > 0;

    const gorunenGorevler = bugununGorevleri.slice(0, 5);

    gorunenGorevler.forEach(function(gorev) {
        const satir = document.createElement("li");

        const kutu = document.createElement("input");
        kutu.type = "checkbox";
        kutu.className = "ana-gorev-kutu";
        kutu.checked = gorev.tamamlandi === true;
        kutu.setAttribute(
            "aria-label",
            gorev.metin + " görevini tamamla"
        );

        const metin = document.createElement("span");
        metin.className = "ana-gorev-metin";
        metin.textContent = gorev.metin;

        if (gorev.tamamlandi) {
            metin.classList.add("tamamlandi");
        }

        kutu.addEventListener("change", function() {
            try {
                const sonGorevler = ozetVerisiniOku(
                    "kendimeAlanGorevler",
                    []
                );

                const kayit = sonGorevler.find(function(item) {
                    return item && item.id === gorev.id;
                });

                if (!kayit) {
                    genelBakisiGuncelle();
                    return;
                }

                kayit.tamamlandi = kutu.checked;

                localStorage.setItem(
                    "kendimeAlanGorevler",
                    JSON.stringify(sonGorevler)
                );

                // Ajanda listesini de guncelle
                gorevler = sonGorevler;
                gorevleriGoster();

                genelBakisiGuncelle();

            } catch (hata) {
                console.error("Gorev guncellenemedi:", hata);
                kutu.checked = !kutu.checked;
                alert("Görev kaydedilemedi.");
            }
        });

        satir.appendChild(kutu);
        satir.appendChild(metin);
        anaGorevListesi.appendChild(satir);
    });

    const kalan = bugununGorevleri.length - gorunenGorevler.length;

    fazlaMesaj.hidden = kalan <= 0;

    if (kalan > 0) {
        fazlaMesaj.textContent =
            kalan + " görev daha var. Tümünü görmek için Ajanda'ya git.";
    }
}

// Hedef ilerlemesini goster
function anaHedefleriGoster() {
    const hedefler = ozetVerisiniOku(
        "kendimeAlanHedefler",
        []
    );

    const toplam = hedefler.length;

    const tamamlanan = hedefler.filter(function(hedef) {
        return hedef && hedef.tamamlandi === true;
    }).length;

    document.getElementById("ana-hedef-sayac").textContent =
        toplam === 0
            ? "Henüz hedef eklemedin."
            : tamamlanan + " / " + toplam + " hedef tamamlandı";

    document.getElementById("ana-hedef-doluluk").style.width =
        (toplam > 0 ? tamamlanan / toplam * 100 : 0) + "%";
}

// Ana sayfanin tum verilerini yenile
function genelBakisiGuncelle() {
    const bugun = tarihAnahtari(new Date());
    const buAy = bugun.slice(0, 7);

    anaKarsilamayiGuncelle();

    // Gorevler
    const kayitliGorevler = ozetVerisiniOku(
        "kendimeAlanGorevler",
        []
    );

    const bugununGorevleri = kayitliGorevler.filter(
        function(gorev) {
            return gorev && gorev.tarih === bugun;
        }
    );

    const tamamlanan = bugununGorevleri.filter(
        function(gorev) {
            return gorev.tamamlandi === true;
        }
    ).length;

    ozetGorev.textContent = bugununGorevleri.length
        ? tamamlanan + " / " + bugununGorevleri.length
            + " tamamlandı"
        : "Bugün görev yok";

    anaGorevleriGoster(kayitliGorevler, bugun);

    // Saglik
    const saglikKayitlari = ozetVerisiniOku(
        "kendimeAlanSaglik",
        {}
    );

    const saglik = saglikKayitlari[bugun] || {};

    ozetSu.textContent =
        saglik.su !== null &&
        saglik.su !== undefined &&
        saglik.su !== "" &&
        Number.isFinite(Number(saglik.su))
            ? Number(saglik.su).toLocaleString("tr-TR") + " ml"
            : "Kayıt yok";

    ozetUyku.textContent =
        saglik.uyku !== null &&
        saglik.uyku !== undefined &&
        saglik.uyku !== "" &&
        Number.isFinite(Number(saglik.uyku))
            ? Number(saglik.uyku).toLocaleString("tr-TR") + " saat"
            : "Kayıt yok";

    // Aylik harcamalar
    const islemler = ozetVerisiniOku(
        "kendimeAlanButceV2",
        ozetVerisiniOku("kendimeAlanIslemler", [])
    );

    const giderler = islemler.filter(function(islem) {
        return islem &&
            typeof islem.tarih === "string" &&
            islem.tarih.slice(0, 7) === buAy &&
            islem.tur === "gider";
    });

    if (giderler.length === 0) {
        ozetHarcama.textContent = "Bu ay kayıt yok";
    } else {
        const toplamGider = giderler.reduce(function(toplam, islem) {
            const tutar = Number(islem.tutar);
            return toplam + (Number.isFinite(tutar) ? tutar : 0);
        }, 0);

        ozetHarcama.textContent =
            bvPara(toplamGider) + " bu ay";
    }

    anaHedefleriGoster();
}

// Kartlarin ilgili sayfaya gitmesini sagla
document.querySelectorAll(
    "#ana-sayfa [data-hedef]"
).forEach(function(buton) {
    buton.addEventListener("click", function() {
        const hedef = buton.dataset.hedef;

        const menuButonu = document.querySelector(
            '.alt-menu button[data-sayfa="' + hedef + '"]'
        );

        if (menuButonu) {
            menuButonu.click();
        }
    });
});

// Ana sayfa acildiginda guncelle
document.querySelectorAll(
    '.alt-menu button[data-sayfa="ana-sayfa"]'
).forEach(function(buton) {
    buton.addEventListener("click", genelBakisiGuncelle);
});

// Uygulamaya geri donunce guncelle
document.addEventListener("visibilitychange", function() {
    if (!document.hidden) {
        genelBakisiGuncelle();
    }
});

// Ilk acilista verileri goster
genelBakisiGuncelle();

// VERI YEDEKLEME VE GERI YUKLEME

const yedekIndir = document.getElementById("yedek-indir");
const yedekDosya = document.getElementById("yedek-dosya");
const yedekDurum = document.getElementById("yedek-durum");

// Uygulamada kullandigimiz veri anahtarlari

const yedekAnahtarlari = {
    kendimeAlanGorevler: "array",
    kendimeAlanHaftalikPlanlar: "array",
    kendimeAlanAylikPlanlar: "array",
    kendimeAlanHedefler: "array",
    kendimeAlanSaglik: "object",
    kendimeAlanIslemler: "array",
    kendimeAlanButceHedefleri: "object",
    kendimeAlanProfil: "object",
    kendimeAlanBakimRutini: "object",
    kendimeAlanHesaplar: "array",
    kendimeAlanGelirKaynaklari: "array",
    kendimeAlanButceV2: "array",
    kendimeAlanKiloOlcumleri: "object",
    kendimeAlanOzelGunler: "array"
};


// Verinin beklenen turde olup olmadigini kontrol et
function yedekTuruDogruMu(veri, tur) {
    if (veri === null) {
        return true;
    }

    if (tur === "array") {
        return (
            Array.isArray(veri) &&
            veri.every(function(kayit) {
                return kayit !== null &&
                    typeof kayit === "object" &&
                    !Array.isArray(kayit);
            })
        );
    }

    return (
        typeof veri === "object" &&
        !Array.isArray(veri)
    );
}


// Eski ve yeni yedekleri kontrol et
function yedekGecerliMi(yedek) {
    if (
        !yedek ||
        yedek.uygulama !== "Kendime Alan" ||
        yedek.surum !== 1 ||
        !yedek.veriler ||
        typeof yedek.veriler !== "object" ||
        Array.isArray(yedek.veriler)
    ) {
        return false;
    }

    return Object.entries(yedekAnahtarlari).every(
        function([anahtar, tur]) {

            // Eski yedeklerde profil bilgisi bulunmayabilir
            if (
                [
    "kendimeAlanProfil",
    "kendimeAlanBakimRutini",
    "kendimeAlanHesaplar",
    "kendimeAlanGelirKaynaklari",
    "kendimeAlanButceV2",
    "kendimeAlanKiloOlcumleri",
    "kendimeAlanOzelGunler"
].includes(anahtar) &&
                !Object.prototype.hasOwnProperty.call(
                    yedek.veriler,
                    anahtar
                )
            ) {
                return true;
            }

            return (
                Object.prototype.hasOwnProperty.call(
                    yedek.veriler,
                    anahtar
                ) &&
                yedekTuruDogruMu(
                    yedek.veriler[anahtar],
                    tur
                )
            );
        }
    );
}


// Yedek dosyasini indir
yedekIndir.addEventListener("click", function() {
    try {
        const veriler = {};

        Object.entries(yedekAnahtarlari).forEach(
            function([anahtar, tur]) {
                const hamVeri = localStorage.getItem(anahtar);

                if (hamVeri === null) {
                    veriler[anahtar] = null;
                    return;
                }

                const veri = JSON.parse(hamVeri);

                if (!yedekTuruDogruMu(veri, tur)) {
                    throw new Error("Gecersiz kayit: " + anahtar);
                }

                veriler[anahtar] = veri;
            }
        );

        const yedek = {
            uygulama: "Kendime Alan",
            surum: 1,
            olusturulmaTarihi: new Date().toISOString(),
            veriler: veriler
        };

        const metin = JSON.stringify(yedek, null, 2);

        const dosya = new Blob([metin], {
            type: "application/json"
        });

        const adres = URL.createObjectURL(dosya);

        const baglanti = document.createElement("a");
        baglanti.href = adres;
        baglanti.download =
            "kendime-alan-yedek-" +
            tarihAnahtari(new Date()) +
            ".json";

        document.body.appendChild(baglanti);
        baglanti.click();
        baglanti.remove();

        setTimeout(function() {
            URL.revokeObjectURL(adres);
        }, 1000);

        yedekDurum.textContent =
            "💗 Yedek dosyan oluşturuldu. İndirilenler klasörünü kontrol et.";

    } catch (hata) {
        console.error("Yedekleme hatasi:", hata);

        yedekDurum.textContent =
            "Yedek oluşturulamadı. Kayıtlarını kontrol et.";
    }
});

// JSON yedegini sec ve geri yukle
yedekDosya.addEventListener("change", async function() {
    const dosya = yedekDosya.files[0];

    if (!dosya) {
        return;
    }

    try {
        if (dosya.size > 5 * 1024 * 1024) {
            throw new Error("Dosya cok buyuk");
        }

        const metin = await dosya.text();
        const yedek = JSON.parse(metin);

        if (!yedekGecerliMi(yedek)) {
            throw new Error("Gecersiz yedek bicimi");
        }

        // Veri kaybi olmamasi icin onay al
        const onay = confirm(
            "Dikkat! Mevcut kayıtların yedekteki " +
            "kayıtlarla değiştirilecek. Devam edilsin mi?"
        );

        if (!onay) {
            yedekDurum.textContent =
                "Geri yükleme iptal edildi.";
            return;
        }

        // Hata durumunda eski kayitlari geri getirebilmek icin sakla
        const eskiVeriler = {};

        Object.keys(yedekAnahtarlari).forEach(
            function(anahtar) {
                eskiVeriler[anahtar] =
                    localStorage.getItem(anahtar);
            }
        );

        try {
           Object.keys(yedekAnahtarlari).forEach(
    function(anahtar) {

       // Eski yedeklerde bulunmayan yeni kayitlari koru
if (
    [
        "kendimeAlanProfil",
        "kendimeAlanBakimRutini",
        "kendimeAlanHesaplar",
        "kendimeAlanGelirKaynaklari",
        "kendimeAlanButceV2",
        "kendimeAlanKiloOlcumleri",
        "kendimeAlanOzelGunler"
    ].includes(anahtar) &&
    !Object.prototype.hasOwnProperty.call(
        yedek.veriler,
        anahtar
    )
) {
    return;
}

        const veri = yedek.veriler[anahtar];

        if (veri === null) {
            localStorage.removeItem(anahtar);
        } else {
            localStorage.setItem(
                anahtar,
                JSON.stringify(veri)
            );
        }
    }
);

        } catch (kayitHatasi) {
            // Degisiklikleri geri almaya calis
            Object.keys(yedekAnahtarlari).forEach(
                function(anahtar) {
                    try {
                        const eski = eskiVeriler[anahtar];

                        if (eski === null) {
                            localStorage.removeItem(anahtar);
                        } else {
                            localStorage.setItem(
                                anahtar,
                                eski
                            );
                        }
                    } catch (geriAlmaHatasi) {
                        console.error(
                            "Kayit geri alinamadi:",
                            anahtar,
                            geriAlmaHatasi
                        );
                    }
                }
            );

            throw kayitHatasi;
        }

        alert(
            "💗 Yedek geri yüklendi. " +
            "Uygulama şimdi yenilenecek."
        );

        // Tum bolumlerin yeni verileri okumasini sagla
        window.location.reload();

    } catch (hata) {
        console.error("Geri yukleme hatasi:", hata);

        yedekDurum.textContent =
            "Dosya geri yüklenemedi. Geçerli bir yedek seç.";

    } finally {
        yedekDosya.value = "";
    }
});

// PROFIL BILGILERI SISTEMI

const profilDepoAnahtari = "kendimeAlanProfil";

const profilForm = document.getElementById("profil-form");
const profilAd = document.getElementById("profil-ad");
const profilNot = document.getElementById("profil-not");
const profilFoto = document.getElementById("profil-foto");
const profilFotoSil = document.getElementById("profil-foto-sil");
const profilAvatar = document.getElementById("profil-avatar");
const profilKarsilama = document.getElementById("profil-karsilama");
const profilTema = document.getElementById("profil-tema");
const profilDurum = document.getElementById("profil-durum");

let profilBilgileri = {
    ad: "",
    not: "",
    foto: "",
    tema: "pudra"
};

let profilOkunabilir = true;

// Kayitli profil bilgilerini oku
try {
    const hamProfil = localStorage.getItem(profilDepoAnahtari);

    if (hamProfil !== null) {
        const kayit = JSON.parse(hamProfil);

        if (
            !kayit ||
            typeof kayit !== "object" ||
            Array.isArray(kayit)
        ) {
            throw new Error("Gecersiz profil kaydi");
        }

        profilBilgileri = {
            ad: typeof kayit.ad === "string" ? kayit.ad : "",
            not: typeof kayit.not === "string" ? kayit.not : "",
            foto: typeof kayit.foto === "string" ? kayit.foto : "",
            tema: ["pudra", "lavanta", "yesil"].includes(kayit.tema)
                ? kayit.tema
                : "pudra"
        };
    }
} catch (hata) {
    profilOkunabilir = false;
    console.error("Profil okunamadi:", hata);
    profilDurum.textContent =
        "Profil kaydı okunamadı. Kaydetme kapatıldı.";
}

// Profil bilgilerini kaydet
function profiliKaydet(yeniProfil) {
    if (!profilOkunabilir) {
        return false;
    }

    try {
        localStorage.setItem(
            profilDepoAnahtari,
            JSON.stringify(yeniProfil)
        );

        profilBilgileri = yeniProfil;
        return true;
    } catch (hata) {
        console.error("Profil kaydedilemedi:", hata);
        profilDurum.textContent =
            "Profil kaydedilemedi. Depolama alanını kontrol et.";
        return false;
    }
}

// Profil resmini ve karsilama metnini goster
function profilGorunumunuGuncelle() {
    profilAvatar.replaceChildren();

    if (
        profilBilgileri.foto.startsWith("data:image/png;base64,") ||
        profilBilgileri.foto.startsWith("data:image/jpeg;base64,") ||
        profilBilgileri.foto.startsWith("data:image/webp;base64,")
    ) {
        const resim = document.createElement("img");
        resim.src = profilBilgileri.foto;
        resim.alt = "Profil fotoğrafı";
        profilAvatar.appendChild(resim);
    } else {
        profilAvatar.textContent = "♡";
    }

    profilKarsilama.textContent = profilBilgileri.ad
        ? "Merhaba, " + profilBilgileri.ad + " 🌷"
        : "Benim küçük dünyam";
}

// Tema rengini uygula
function profilTemasiniUygula() {
    document.body.classList.remove(
        "tema-lavanta",
        "tema-yesil"
    );

    if (profilBilgileri.tema === "lavanta") {
        document.body.classList.add("tema-lavanta");
    }

    if (profilBilgileri.tema === "yesil") {
        document.body.classList.add("tema-yesil");
    }

    profilTema.value = profilBilgileri.tema;
}

// Isim ve notu kaydet
profilForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const yeniProfil = {
        ...profilBilgileri,
        ad: profilAd.value.trim(),
        not: profilNot.value.trim()
    };

    if (profiliKaydet(yeniProfil)) {
        profilGorunumunuGuncelle();
        profilDurum.textContent =
            "💗 Profil bilgilerin kaydedildi.";
    }
});

// Profil fotografi sec
profilFoto.addEventListener("change", function() {
    const dosya = profilFoto.files[0];

    if (!dosya || !profilOkunabilir) {
        return;
    }

    if (
        !["image/png", "image/jpeg", "image/webp"].includes(dosya.type)
    ) {
        profilDurum.textContent =
            "PNG, JPG veya WEBP fotoğraf seç.";
        profilFoto.value = "";
        return;
    }

    if (dosya.size > 200 * 1024) {
        profilDurum.textContent =
            "Fotoğraf 200 KB'den küçük olmalı.";
        profilFoto.value = "";
        return;
    }

    const okuyucu = new FileReader();

    okuyucu.onload = function() {
        const yeniProfil = {
            ...profilBilgileri,
            foto: String(okuyucu.result || "")
        };

        if (profiliKaydet(yeniProfil)) {
            profilGorunumunuGuncelle();
            profilDurum.textContent =
                "💗 Profil fotoğrafın kaydedildi.";
        }

        profilFoto.value = "";
    };

    okuyucu.onerror = function() {
        profilDurum.textContent =
            "Fotoğraf okunamadı. Tekrar dene.";
        profilFoto.value = "";
    };

    okuyucu.readAsDataURL(dosya);
});

// Fotografi kaldir
profilFotoSil.addEventListener("click", function() {
    const yeniProfil = {
        ...profilBilgileri,
        foto: ""
    };

    if (profiliKaydet(yeniProfil)) {
        profilGorunumunuGuncelle();
        profilDurum.textContent =
            "Profil fotoğrafın kaldırıldı.";
    }
});

// Tema degisikligini kaydet
profilTema.addEventListener("change", function() {
    const yeniProfil = {
        ...profilBilgileri,
        tema: profilTema.value
    };

    if (profiliKaydet(yeniProfil)) {
        profilTemasiniUygula();
        profilDurum.textContent =
            "🌷 Tema tercihin kaydedildi.";
    } else {
        profilTema.value = profilBilgileri.tema;
    }
});

// Ilk acilista bilgileri yukle
profilAd.value = profilBilgileri.ad;
profilNot.value = profilBilgileri.not;

profilGorunumunuGuncelle();
profilTemasiniUygula();

if (!profilOkunabilir) {
    profilForm.querySelectorAll(
        "input, textarea, button"
    ).forEach(function(eleman) {
        eleman.disabled = true;
    });

    profilTema.disabled = true;
}


// SAYFA KARTLARI VE GELIR AYARLARI
function kaKartlariAcilirYap() {
    function kartDonustur(kart, ilkAcik = false) {
        if (!kart || kart.tagName === "DETAILS" || kart.classList.contains("ka-acilir-kart")) return;
        const baslik = Array.from(kart.children).find(x => /^H[234]$/.test(x.tagName));
        if (!baslik) return;
        const detay = document.createElement("details");
        detay.className = kart.className + " ka-acilir-kart";
        detay.id = kart.id;
        if (ilkAcik) detay.open = true;
        const ozet = document.createElement("summary");
        ozet.className = "ka-acilir-baslik";
        const baslikMetni = document.createElement("span");
        baslikMetni.textContent = baslik.textContent.trim();
        const simge = document.createElement("span");
        simge.className = "ka-acilir-ok";
        simge.textContent = "⌄";
        ozet.append(baslikMetni, simge);
        const icerik = document.createElement("div");
        icerik.className = "ka-acilir-icerik";
        Array.from(kart.childNodes).forEach(node => {
            if (node !== baslik) icerik.appendChild(node);
        });
        kart.replaceWith(detay);
        detay.append(ozet, icerik);
        return detay;
    }
    document.querySelectorAll("#saglik > #saglik-form > .saglik-kart").forEach((kart,index) => {
        if (index > 0) kartDonustur(kart);
    });
    document.querySelectorAll("#butce > .butce-kart").forEach(kart => {
        if (!kart.classList.contains("bv-donem")) {
            kartDonustur(kart, !!kart.querySelector("#bv-hesap-kartlari"));
        }
    });
}

function kaProfilGelirAyarlariniAc() {
    const nav = document.querySelector('.alt-menu button[data-sayfa="profil"]');
    if (nav) nav.click();
    kaProfilAyarlariAc("ka-gelir-ayarlari");
}
function kaGelirOzetiniGoster() {
    const liste = document.getElementById("ka-butce-gelir-listesi");
    if (!liste) return;
    liste.replaceChildren();
    if (!bvKaynaklar.length) {
        const bos = document.createElement("p");
        bos.textContent = "Henüz düzenli gelir kaynağı tanımlamadın. Profil → Ayarlar'dan ekleyebilirsin.";
        liste.appendChild(bos);
    }
    bvKaynaklar.forEach(k => {
        const satir = bvSatirOlustur(k.ad,
            bvPara(k.tutar) + " · " + bvHesapAdi(k.hesapId) + " · " +
            (k.tekrar === "aylik" ? "Her ayın " + Number(k.tarih.slice(8)) + ". günü" : k.tarih),
            [{yazi:"💗 Geliri Aldım",etiket:k.ad + " gelirini alındı olarak kaydet",tik:()=>bvKaynakGeliriniKaydet(k)}]
        );
        liste.appendChild(satir);
    });
}
function kaGelirAyarlariniTasi() {
    const profil = document.getElementById("profil");
    const kaynakListe = document.getElementById("bv-kaynak-listesi");
    const kaynakForm = document.getElementById("bv-kaynak-form");
    const kaynakKart = kaynakListe && kaynakListe.closest(".butce-kart");
    if (!profil || !kaynakKart || !kaynakForm) return;
    const panel = document.createElement("section");
    panel.id = "ka-gelir-ayarlari";
    panel.className = "profil-panel ka-gelir-ayar-panel";
    const baslik = document.createElement("h3");
    baslik.textContent = "⚙️ Ayarlar · Gelir Kaynaklarım";
    const not = document.createElement("p");
    not.textContent = "Düzenli gelirlerini buradan tanımla ve yönet. Gelir gerçekten geldiğinde Bütçe sayfasından onayla.";
    panel.append(baslik,not,kaynakListe,kaynakForm);
    const rutinPanel = document.getElementById("profil-rutin-ayarlari");
    if (rutinPanel) rutinPanel.insertAdjacentElement("afterend",panel);
    else profil.appendChild(panel);
    const butceKart = document.createElement("div");
    butceKart.className = "butce-kart";
    const butceBaslik = document.createElement("h3");
    butceBaslik.textContent = "🌸 Beklenen Gelirlerim";
    const aciklama = document.createElement("p");
    aciklama.className = "bv-bilgi";
    aciklama.textContent = "Gelir kaynağını Profil → Ayarlar'dan düzenle. Para gerçekten alındığında burada işaretle.";
    const gelirListesi = document.createElement("div");
    gelirListesi.id = "ka-butce-gelir-listesi";
    gelirListesi.className = "bv-liste";
    const profilButonu = document.createElement("button");
    profilButonu.type = "button";
    profilButonu.className = "bv-ikincil";
    profilButonu.textContent = "⚙️ Gelir Kaynaklarımı Yönet";
    profilButonu.addEventListener("click",kaProfilGelirAyarlariniAc);
    butceKart.append(butceBaslik,aciklama,gelirListesi,profilButonu);
    kaynakKart.replaceWith(butceKart);
    kaGelirOzetiniGoster();
}

function kaProfilAyarlariAc(hedefId) {
    const ayarlar = document.getElementById("ka-profil-ayarlar");
    if (ayarlar) ayarlar.open = true;
    const hedef = document.getElementById(hedefId);
    if (hedef) hedef.scrollIntoView({behavior:"smooth",block:"start"});
}

function kaProfilKartlariniKur() {
    const profil = document.getElementById("profil");
    if (!profil) return;
    const rutin = document.getElementById("profil-rutin-ayarlari");
    const gelir = document.getElementById("ka-gelir-ayarlari");
    if (!rutin || !gelir) return;

    function acilirKartaCevir(kart, ilkAcik) {
        if (!kart || kart.tagName === "DETAILS") return null;
        const baslik = Array.from(kart.children).find(el => /^H[234]$/.test(el.tagName));
        if (!baslik) return null;
        const detay = document.createElement("details");
        detay.className = kart.className + " ka-acilir-kart ka-profil-kart";
        if (ilkAcik) detay.open = true;
        if (kart.id) detay.id = kart.id;
        const ozet = document.createElement("summary");
        ozet.className = "ka-acilir-baslik";
        const baslikYazi = document.createElement("span");
        baslikYazi.textContent = baslik.textContent.trim();
        const ok = document.createElement("span");
        ok.className = "ka-acilir-ok";
        ok.textContent = "⌄";
        ozet.append(baslikYazi,ok);
        const icerik = document.createElement("div");
        icerik.className = "ka-acilir-icerik";
        Array.from(kart.childNodes).forEach(n => {
            if (n !== baslik) icerik.appendChild(n);
        });
        kart.replaceWith(detay);
        detay.append(ozet,icerik);
        return detay;
    }

    // Tek ayarlar kartinda iki yonetim bolumu.
    const ayarlar = document.createElement("details");
    ayarlar.id = "ka-profil-ayarlar";
    ayarlar.className = "profil-panel ka-acilir-kart ka-profil-kart";
    const ozet = document.createElement("summary");
    ozet.className = "ka-acilir-baslik";
    const yazi = document.createElement("span");
    yazi.textContent = "⚙️ Ayarlar";
    const ok = document.createElement("span");
    ok.className = "ka-acilir-ok";
    ok.textContent = "⌄";
    ozet.append(yazi,ok);
    const icerik = document.createElement("div");
    icerik.className = "ka-acilir-icerik ka-profil-ayar-icerik";
    const rutinBasligi = rutin.querySelector("h3");
    if (rutinBasligi) rutinBasligi.remove();
    const gelirBasligi = gelir.querySelector("h3");
    if (gelirBasligi) gelirBasligi.textContent = "💰 Gelir Kaynaklarım";
    rutin.classList.add("ka-profil-altbolum");
    gelir.classList.add("ka-profil-altbolum");
    ayarlar.append(ozet,icerik);
    icerik.append(rutin,gelir);
    const yedek = document.getElementById("veri-yonetimi");
    if (yedek) yedek.before(ayarlar);
    else profil.appendChild(ayarlar);

    profil.querySelectorAll(":scope > .profil-panel, :scope > #veri-yonetimi").forEach(kart => {
        if (kart === ayarlar) return;
        acilirKartaCevir(kart, !!kart.querySelector("#profil-form"));
    });
}

kaGelirAyarlariniTasi();
kaProfilKartlariniKur();
kaKartlariAcilirYap();
bvYenile();

// Hesap hareketlerini acik olan kartta goster
const kaHesapKartlari = document.getElementById("bv-hesap-kartlari");
if (kaHesapKartlari) {
    kaHesapKartlari.addEventListener("click",event => {
        const dugme = event.target.closest("button");
        if (!dugme || (dugme.textContent !== "İşlemleri Gör" && dugme.textContent !== "Filtreyi Kaldır")) return;
        const islemKart = document.getElementById("bv-islem-listesi").closest("details");
        if (islemKart) islemKart.open = true;
    });
}


// SON ROTUSLAR: SAGLIK DONEMI, KALORI, KILO VE OZEL GUNLER
function kaKaloriToplaminiGoster() {
    const alan = document.getElementById("ka-gunluk-kalori");
    if (!alan) return;
    const bilinenler = gunlukOgunler.filter(o => o.kalori !== null && o.kalori !== undefined && o.kalori !== "" && Number.isFinite(Number(o.kalori)));
    alan.textContent = bilinenler.length ? "Girilen kalorilerin toplamı: " + bilinenler.reduce((t, o) => t + Number(o.kalori), 0).toLocaleString("tr-TR") + " kcal (" + bilinenler.length + " öğün)" : "Girilen kalorilerin toplamı: —";
}

const kaKiloAnahtar = "kendimeAlanKiloOlcumleri";
const kaKiloTarih = document.getElementById("ka-kilo-tarih");
const kaKiloDeger = document.getElementById("ka-kilo-deger");
let kaKiloOlcumleri = {};
try {
    const ham = JSON.parse(localStorage.getItem(kaKiloAnahtar) || "{}");
    if (ham && typeof ham === "object" && !Array.isArray(ham)) kaKiloOlcumleri = ham;
} catch (hata) { console.error("Kilo olcumleri okunamadi", hata); }
function kaKiloListele() {
    const liste = document.getElementById("ka-kilo-liste");
    const ozet = document.getElementById("ka-kilo-ozet");
    liste.replaceChildren();
    ozet.replaceChildren();
    const sirali = Object.entries(kaKiloOlcumleri)
        .filter(([t, n]) => /^\d{4}-\d\d-\d\d$/.test(t) && Number.isFinite(Number(n)))
        .sort((a,b) => a[0].localeCompare(b[0]));
   if (!sirali.length) {
    const bosKart = document.createElement("div");
    bosKart.className = "ka-kilo-ozet-hero";

    const baslik = document.createElement("strong");
    baslik.textContent = "🌷 İlk ölçümünü ekle";

    const aciklama = document.createElement("small");
    aciklama.textContent =
        "Ölçümlerini eklediğinde geçmişini burada görebilirsin.";

    bosKart.append(baslik, aciklama);
    ozet.appendChild(bosKart);

    liste.textContent = "";
    return;
}
    const [sonTarih,sonDeger] = sirali[sirali.length-1];
    const oncekiDeger = sirali.length > 1 ? Number(sirali[sirali.length-2][1]) : null;
    const degerFormat = n => Number(n).toLocaleString("tr-TR",{maximumFractionDigits:1});
    const tarihFormat = t => t.split("-").reverse().join(".");
    const hero = document.createElement("div"); hero.className = "ka-kilo-ozet-hero";
    const buyuk = document.createElement("strong"); buyuk.textContent = degerFormat(sonDeger) + " kg";
    const tarih = document.createElement("small"); tarih.textContent = "Son ölçüm · " + tarihFormat(sonTarih);
    hero.append(buyuk,tarih);
    const farkAlani = document.createElement("div"); farkAlani.className = "ka-kilo-ozet-fark";
    if (oncekiDeger === null) {
        farkAlani.textContent = "Önceki ölçüm henüz yok";
    } else {
        const fark = Math.round((Number(sonDeger)-oncekiDeger)*10)/10;
        const farkYazi = (fark > 0 ? "+" : fark < 0 ? "−" : "") + degerFormat(Math.abs(fark)) + " kg";
        const kucuk = document.createElement("small"); kucuk.textContent = "Önceki ölçüme göre";
        const sonuc = document.createElement("strong"); sonuc.textContent = farkYazi;
        farkAlani.append(kucuk,sonuc);
    }
    ozet.append(hero,farkAlani);
    const baslik = document.createElement("h4"); baslik.className="ka-kilo-gecmis-baslik"; baslik.textContent="Ölçüm geçmişi";
    liste.append(baslik);
    for (let i=sirali.length-1;i>=0;i--) {
        const [olcumTarih,olcum] = sirali[i];
        const satir=document.createElement("div"); satir.className="ka-kilo-gecmis-satir";
        const gun=document.createElement("span"); gun.textContent=tarihFormat(olcumTarih);
        const sag=document.createElement("span"); sag.className="ka-kilo-gecmis-deger";
        const sayi=document.createElement("strong"); sayi.textContent=degerFormat(olcum)+" kg";
        sag.append(sayi);
        if (i>0) {
            const fark=Math.round((Number(olcum)-Number(sirali[i-1][1]))*10)/10;
            const k=document.createElement("small");
            k.textContent=" ("+(fark>0?"+":fark<0?"−":"")+degerFormat(Math.abs(fark))+" kg)";
            sag.append(k);
        }
        satir.append(gun,sag); liste.append(satir);
    }
}
kaKiloTarih.value = tarihAnahtari(new Date());
kaKiloTarih.addEventListener("change", () => { kaKiloDeger.value = kaKiloOlcumleri[kaKiloTarih.value] ?? ""; });
document.getElementById("ka-kilo-ekle").addEventListener("click", () => {
    const tarih = kaKiloTarih.value, deger = Number(kaKiloDeger.value);
    if (!tarih || !kaKiloDeger.value || !Number.isFinite(deger) || deger < 1 || deger > 500) return alert("Geçerli bir tarih ve ölçüm gir.");
    const yeni = {...kaKiloOlcumleri, [tarih]: deger};
    try { localStorage.setItem(kaKiloAnahtar, JSON.stringify(yeni)); kaKiloOlcumleri = yeni; kaKiloListele(); document.getElementById("ka-kilo-durum").textContent = "Ölçüm kaydedildi. 💗"; }
    catch (hata) { alert("Ölçüm kaydedilemedi. Depolama alanını kontrol et."); }
});
document.getElementById("ka-kilo-sil").addEventListener("click", () => {
    const tarih = kaKiloTarih.value;
    if (!Object.prototype.hasOwnProperty.call(kaKiloOlcumleri,tarih) || !confirm("Seçili tarihteki ölçüm silinsin mi?")) return;
    const yeni = {...kaKiloOlcumleri}; delete yeni[tarih];
    try { localStorage.setItem(kaKiloAnahtar, JSON.stringify(yeni)); kaKiloOlcumleri = yeni; kaKiloDeger.value = ""; kaKiloListele(); } catch (hata) { alert("Silinemedi."); }
});
kaKiloListele();

// Saglikta gunluk kayit, haftalik ve aylik ozet
const kaSaglikGun = document.getElementById("ka-saglik-donem");
let kaSaglikMod = "gun";
let kaSaglikOdak = new Date();
function kaSaglikDonemSinirlari() {
    const t = new Date(kaSaglikOdak.getFullYear(),kaSaglikOdak.getMonth(),kaSaglikOdak.getDate());
    if (kaSaglikMod === "hafta") t.setDate(t.getDate() - (t.getDay()+6)%7);
    if (kaSaglikMod === "ay") t.setDate(1);
    const bitis = new Date(t);
    if (kaSaglikMod === "gun") bitis.setDate(bitis.getDate()+1);
    else if (kaSaglikMod === "hafta") bitis.setDate(bitis.getDate()+7);
    else bitis.setMonth(bitis.getMonth()+1);
    return [t,bitis];
}
function kaSaglikDonemGoster() {
    const [ilk,son] = kaSaglikDonemSinirlari();
    const sonGun = new Date(son.getFullYear(),son.getMonth(),son.getDate()-1);
    const fmt = t => t.toLocaleDateString("tr-TR", {day:"numeric",month:"short",year:"numeric"});
    document.getElementById("ka-saglik-baslik").textContent = kaSaglikMod === "ay" ? ilk.toLocaleDateString("tr-TR",{month:"long",year:"numeric"}) : kaSaglikMod === "hafta" ? fmt(ilk)+" – "+fmt(sonGun) : fmt(ilk);
    kaSaglikGun.querySelectorAll("[data-ka-saglik-mod]").forEach(b => b.classList.toggle("bv-sekme-aktif",b.dataset.kaSaglikMod===kaSaglikMod));
    const ozet = document.getElementById("ka-saglik-donem-ozet");
    const gunluk = kaSaglikMod === "gun";
    document.getElementById("saglik-form").hidden = !gunluk;
    ozet.hidden = gunluk;
    if (gunluk) {
        const tarih = tarihAnahtari(ilk);
        if (saglikTarih.value !== tarih) { saglikTarih.value = tarih; saglikKaydiniGoster(); }
        return;
    }
    ozet.replaceChildren();
    const baslik = document.createElement("h3"); baslik.textContent = "🌷 Dönem Özeti"; ozet.append(baslik);
    const veriler = Object.entries(saglikKayitlari).filter(([t]) => t >= tarihAnahtari(ilk) && t < tarihAnahtari(son));
   // Gunluk ortalama su
const sular = veriler
    .map(([, kayit]) => Number(kayit.su))
    .filter(su => Number.isFinite(su) && su > 0);

const ortalamaSu = sular.length
    ? sular.reduce((toplam, su) => toplam + su, 0) / sular.length
    : null;

// Gunluk ortalama uyku
const uykular = veriler
    .map(([, kayit]) => Number(kayit.uyku))
    .filter(uyku => Number.isFinite(uyku) && uyku > 0);

const ortalamaUyku = uykular.length
    ? uykular.reduce((toplam, uyku) => toplam + uyku, 0) / uykular.length
    : null;

// Kalori bilgisi girilen gunlerin toplamlarini hesapla
const gunlukKaloriler = veriler
    .map(([, kayit]) => {
        const ogunler = Array.isArray(kayit.ogunler) ? kayit.ogunler : [];

        const bilinenOgunler = ogunler.filter(ogun =>
            ogun.kalori !== null &&
            ogun.kalori !== undefined &&
            ogun.kalori !== "" &&
            Number.isFinite(Number(ogun.kalori))
        );

        if (!bilinenOgunler.length) return null;

        return bilinenOgunler.reduce(
            (toplam, ogun) => toplam + Number(ogun.kalori), 0
        );
    })
    .filter(toplam => toplam !== null);

const ortalamaKalori = gunlukKaloriler.length
    ? gunlukKaloriler.reduce((toplam, kalori) => toplam + kalori, 0)
        / gunlukKaloriler.length
    : null;

// Donem ozeti
const satirlar = [
    "Kayıt bulunan gün: " + veriler.length,

    "Ortalama su: " +
        (ortalamaSu === null
            ? "—"
            : Math.round(ortalamaSu).toLocaleString("tr-TR") + " ml"),

    "Kayıtlı uyku ortalaması: " +
        (ortalamaUyku === null
            ? "—"
            : ortalamaUyku.toLocaleString("tr-TR", {
                maximumFractionDigits: 1
            }) + " saat"),

    "Günlük ortalama kalori: " +
        (ortalamaKalori === null
            ? "—"
            : Math.round(ortalamaKalori).toLocaleString("tr-TR") + " kcal")
];
    satirlar.forEach(metin => { const p = document.createElement("p"); p.textContent = metin; ozet.append(p); });
    const dipnot = document.createElement("small"); dipnot.textContent = "Özetler yalnızca kaydettiğin bilgileri içerir. Günlük görünümden kayıt ekleyebilirsin."; ozet.append(dipnot);
}
kaSaglikGun.querySelectorAll("[data-ka-saglik-mod]").forEach(b => b.addEventListener("click", () => { kaSaglikMod = b.dataset.kaSaglikMod; kaSaglikDonemGoster(); }));
document.getElementById("ka-saglik-onceki").addEventListener("click", () => { if(kaSaglikMod==="ay") kaSaglikOdak.setMonth(kaSaglikOdak.getMonth()-1,1); else kaSaglikOdak.setDate(kaSaglikOdak.getDate()-(kaSaglikMod==="hafta"?7:1)); kaSaglikDonemGoster(); });
document.getElementById("ka-saglik-sonraki").addEventListener("click", () => { if(kaSaglikMod==="ay") kaSaglikOdak.setMonth(kaSaglikOdak.getMonth()+1,1); else kaSaglikOdak.setDate(kaSaglikOdak.getDate()+(kaSaglikMod==="hafta"?7:1)); kaSaglikDonemGoster(); });
saglikTarih.addEventListener("change", () => { const d = saglikTarih.value.split("-").map(Number); if (d.length===3) kaSaglikOdak = new Date(d[0],d[1]-1,d[2]); kaSaglikDonemGoster(); });
kaSaglikDonemGoster();

// Ozel gunler profil ayarlarinda, takvimde emojiyle
const kaOzelGunAnahtar = "kendimeAlanOzelGunler";
window.kaOzelGunler = [];
try { const d = JSON.parse(localStorage.getItem(kaOzelGunAnahtar) || "[]"); if (Array.isArray(d)) window.kaOzelGunler = d; } catch(e) { console.error("Ozel gunler okunamadi",e); }
function kaOzelGunleriGoster() {
    const liste = document.getElementById("ka-ozel-gun-listesi"); liste.replaceChildren();
    window.kaOzelGunler.forEach(o => {
        const satir = document.createElement("div"); satir.className="saglik-liste-satir";
        const adi = document.createElement("span"); adi.textContent = o.emoji + " " + o.ad + " · " + o.tarih.split("-").reverse().join(".") + (o.tekrar ? " · Her yıl" : "");
        const duz = document.createElement("button"); duz.type="button"; duz.className="saglik-satir-buton"; duz.textContent="✏️"; duz.setAttribute("aria-label","Özel günü düzenle");
        duz.addEventListener("click",()=>{document.getElementById("ka-ozel-ad").value=o.ad;document.getElementById("ka-ozel-tarih").value=o.tarih;document.getElementById("ka-ozel-emoji").value=o.emoji;document.getElementById("ka-ozel-tekrar").checked=!!o.tekrar;document.getElementById("ka-ozel-id").value=o.id;});
        const sil = document.createElement("button"); sil.type="button"; sil.className="saglik-satir-buton"; sil.textContent="🗑️"; sil.setAttribute("aria-label","Özel günü sil");
        sil.addEventListener("click",()=>{if(!confirm("Özel gün silinsin mi?"))return;kaOzelGunleriKaydet(window.kaOzelGunler.filter(x=>x.id!==o.id));});
        satir.append(adi,duz,sil);liste.append(satir);
    });
    if(!window.kaOzelGunler.length)liste.textContent="Henüz özel gün eklenmedi.";
}
function kaOzelGunleriKaydet(liste) {
    try {localStorage.setItem(kaOzelGunAnahtar,JSON.stringify(liste));window.kaOzelGunler=liste;kaOzelGunleriGoster();takvimiGoster();}
    catch(hata){alert("Özel gün kaydedilemedi.");}
}
const kaAyarIcerik = document.querySelector("#ka-profil-ayarlar > .ka-acilir-icerik");
if (kaAyarIcerik) {
    const panel = document.createElement("section"); panel.className="ka-profil-altbolum ka-ozel-gunler";panel.id="ka-ozel-gunler";
    panel.innerHTML = `<h3>🎉 Özel Günlerim</h3><p>Takvimde görünmesini istediğin emoji ve tarihleri ekle.</p><form id="ka-ozel-form"><input type="hidden" id="ka-ozel-id"><label for="ka-ozel-ad">Özel günün adı</label><input type="text" id="ka-ozel-ad" maxlength="80" required placeholder="Örn: Doğum günü"><label for="ka-ozel-tarih">Tarih</label><input type="date" id="ka-ozel-tarih" required><label for="ka-ozel-emoji">Emoji</label><input type="text" id="ka-ozel-emoji" maxlength="12" placeholder="🎂" value="🎉"><label class="ka-ozel-tekrar"><input type="checkbox" id="ka-ozel-tekrar" checked> Her yıl tekrarlansın</label><button type="submit" class="saglik-ikincil">Özel Günü Kaydet</button><button type="button" id="ka-ozel-iptal" class="saglik-ikincil">Temizle</button></form><div id="ka-ozel-gun-listesi"></div>`;
    kaAyarIcerik.append(panel);
    function temizle(){document.getElementById("ka-ozel-form").reset();document.getElementById("ka-ozel-id").value="";}
    document.getElementById("ka-ozel-iptal").addEventListener("click",temizle);
    document.getElementById("ka-ozel-form").addEventListener("submit",e=>{
        e.preventDefault(); const id=document.getElementById("ka-ozel-id").value || crypto.randomUUID();
        const ad=document.getElementById("ka-ozel-ad").value.trim(), tarih=document.getElementById("ka-ozel-tarih").value;
        const emoji=document.getElementById("ka-ozel-emoji").value.trim()||"🎉";
        if(!ad||!tarih)return;
        const yeni={id,ad,tarih,emoji,tekrar:document.getElementById("ka-ozel-tekrar").checked};
        kaOzelGunleriKaydet([...window.kaOzelGunler.filter(x=>x.id!==id),yeni]); temizle();
    });
    kaOzelGunleriGoster();
    takvimiGoster();
}
// Beslenme gunlugu yeni gorunum

(function () {
    const kart = document.querySelector(".beslenme-bolum");
    if (!kart) return;

    const icerik = kart.querySelector(".ka-acilir-icerik") || kart;
    const liste = document.getElementById("ogun-listesi");
    const toplam = document.getElementById("ka-gunluk-kalori");
    const ekle = document.getElementById("ogun-ekle");
    const iptal = document.getElementById("ogun-iptal");
    const saat = document.getElementById("ogun-saat");

    if (!liste || !toplam || !ekle || !saat) return;

    const form = document.createElement("div");
    form.className = "ka-ogun-form";
    form.hidden = true;

    const saatSatiri = saat.closest(".saglik-ikili");

    const kalori = document.getElementById("ogun-kalori");
    const kaloriEtiketi = icerik.querySelector('label[for="ogun-kalori"]');

    form.append(
        saatSatiri,
        kaloriEtiketi,
        kalori,
        ekle,
        iptal
    );

    const yeniButon = document.createElement("button");
    yeniButon.type = "button";
    yeniButon.className = "ka-ogun-ac-buton";
    yeniButon.textContent = "＋ Yeni Öğün Ekle";

    const aciklama = icerik.querySelector(".saglik-kucuk-yazi");

    if (aciklama) {
        form.appendChild(aciklama);
    }

    icerik.append(toplam, yeniButon, form);

    yeniButon.addEventListener("click", function () {
        form.hidden = !form.hidden;
        yeniButon.textContent = form.hidden
            ? "＋ Yeni Öğün Ekle"
            : "− Formu Kapat";
    });

    liste.addEventListener("click", function (event) {
        const buton = event.target.closest("button");
        if (!buton || buton.textContent.trim() !== "✏️") return;

        form.hidden = false;
        yeniButon.textContent = "− Formu Kapat";
    });

    ekle.addEventListener("click", function () {
        if (ekle.textContent === "+ Öğün Ekle") {
            form.hidden = true;
            yeniButon.textContent = "＋ Yeni Öğün Ekle";
        }
    });

    iptal.addEventListener("click", function () {
        form.hidden = true;
        yeniButon.textContent = "＋ Yeni Öğün Ekle";
    });
})();
// Tarihsiz gorevler bolumunu gizle
const tarihsizListe = document.getElementById("tarihsiz-gorev-listesi");

if (tarihsizListe) {
    const tarihsizBolum = tarihsizListe.closest(".gorev-listesi-alani");

    if (tarihsizBolum) {
        tarihsizBolum.style.setProperty("display", "none", "important");
    }
}