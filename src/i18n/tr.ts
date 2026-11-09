import type { en } from './en';

export const tr: Record<keyof typeof en, string> = {
  'tab.home': 'Ana Sayfa', 'tab.runs': 'Koşular', 'tab.stats': 'İstatistik', 'tab.feed': 'Akış', 'tab.you': 'Profil',
  'common.back': 'Geri', 'common.cancel': 'Vazgeç', 'common.close': 'Kapat', 'common.dismiss': 'Kapat',
  'common.settings': 'Ayarlar', 'common.tryAgain': 'Tekrar dene', 'common.tryingAgain': 'Deneniyor…',
  'common.loading': 'Yükleniyor', 'common.notSet': 'Eklenmedi', 'common.logo': 'Exa Running Clan',
  'common.clubName': 'EXA RUNNING CLAN', 'common.justNow': 'Az önce', 'common.yesterday': 'Dün',
  'common.minutesAgo': '{n} dk', 'common.hoursAgo': '{n} sa', 'common.save': 'Kaydet', 'common.saved': 'Kaydedildi',

  'welcome.place': 'Girne · Kuzey Kıbrıs · 2025’ten beri',
  'welcome.headline': 'Haftada\niki koşu.\nKimse yalnız değil.',
  'welcome.body': '350 koşucu, her tempoya yer var ve her koşudan sonra kahve.',
  'welcome.create': 'Hesap oluştur', 'welcome.have': 'Zaten hesabım var',
  'welcome.setup': 'Supabase projesi ayarlanmamış. .env.example dosyasını .env olarak kopyalayın, proje adresini ve anon anahtarını ekleyin, ardından `npx expo start --clear` ile yeniden başlatın.',

  'auth.email': 'E-posta', 'auth.password': 'Şifre', 'auth.emailInvalid': 'Geçerli bir e-posta adresi gir',
  'auth.showPassword': 'Şifreyi göster', 'auth.hidePassword': 'Şifreyi gizle', 'auth.show': 'Göster', 'auth.hide': 'Gizle',
  'auth.offline': 'Bağlantı yok. İnternete bağlanınca tekrar dene.',

  'signin.headline': 'Tekrar\nhoş geldin.', 'signin.sub': 'Haftada iki koşu ve sıradaki seni bekliyor.',
  'signin.passwordMissing': 'Şifreni gir', 'signin.forgotNeedsEmail': 'Önce e-postanı gir, sıfırlama bağlantısı gönderelim',
  'signin.resetSent': 'Sıfırlama bağlantısı için gelen kutunu kontrol et.', 'signin.forgot': 'Unuttum?',
  'signin.submit': 'Giriş yap', 'signin.busy': 'Giriş yapılıyor…', 'signin.newHere': 'Yeni misin?', 'signin.create': 'Hesap oluştur',
  'signin.badCredentials': 'E-posta ve şifre eşleşmiyor.', 'signin.unconfirmed': 'Önce e-posta adresini onayla.',

  'reg.step': 'Adım {n} / 3', 'reg.join': 'Gruba katıl', 'reg.who': 'Sen\nkimsin?', 'reg.fullName': 'Ad soyad',
  'reg.namePlaceholder': 'Ayşe Demir', 'reg.nameMissing': 'Adını yaz', 'reg.passwordRule': 'En az 8 karakter',
  'reg.emailUse': 'E-postanı yalnızca hesabın ve grup duyuruları için kullanırız.',
  'reg.paceTitle': 'Tempo grubunu\nseç.', 'reg.paceSub': 'Kilometre başına dakika. Her koşudan önce değiştirebilirsin.',
  'reg.paceMissing': 'Bir grup seç. Her koşudan önce değiştirebilirsin.',
  'reg.paceHelp': 'Emin değil misin? Serbest tempoyu seç ve rahat ettiğin hızda koş. Kimse yalnız bitirmez.',
  'reg.ownPaceHint': 'Rahat ettiğin hızda', 'reg.minKm': 'dk/km', 'reg.minKmLabel': 'Kilometrede {pace} dakika',
  'reg.ownPaceLabel': 'Serbest tempo, rahat ettiğin hızda',
  'reg.runsTitle': 'Hangi koşulara\ngeliyorsun?', 'reg.runsSub': 'Genelde katıldığın koşuları seç. İstediğin zaman ikisine de gelebilirsin.',
  'reg.wed': 'ÇAR', 'reg.sun': 'PAZ', 'reg.wedLabel': 'Trackday', 'reg.sunLabel': 'Uzun koşu',
  'reg.continue': 'Devam', 'reg.submit': 'Gruba katıl', 'reg.busy': 'Katılıyor…',
  'reg.emailTaken': 'Bu e-posta zaten kayıtlı. Giriş yap.', 'reg.passwordRejected': 'Bu şifre kabul edilmedi. Daha uzun bir şifre dene.',

  'done.kicker': 'Üye #{n} · aramıza hoş geldin', 'done.headline': '{day}\ngörüşürüz,\n{name}.', 'done.runner': 'koşucu',
  'done.runLine': '{title}, {time}. {place}. {pace}', 'done.ownPace': 'Rahat ettiğin tempoda koş.', 'done.lookFor': '{pace} grubunu ara.',
  'done.paceGroup': 'Tempo grubu', 'done.going': '{day} gelenler', 'done.open': 'Uygulamayı aç', 'done.dayFallback': 'Çarşamba',
  'done.confirmKicker': 'Son bir adım', 'done.confirmTitle': 'E-postanı\nkontrol et.',
  'done.confirmBody': '{email} adresine bir onay bağlantısı gönderdik. Bağlantıya dokun, sonra giriş yap.', 'done.toSignIn': 'Giriş ekranına git',

  'reset.title': 'Yeni bir\nşifre seç.', 'reset.field': 'Yeni şifre', 'reset.submit': 'Şifreyi kaydet', 'reset.busy': 'Kaydediliyor…', 'reset.saved': 'Şifren değiştirildi.', 'reset.failed': 'Şifren değiştirilemedi. Yeni bir bağlantı isteyip tekrar dene.',

  'gate.title': 'Veriler yüklenemedi', 'gate.body': 'Bağlantını kontrol edip tekrar dene.',

  'pace.own': 'Serbest', 'pace.ownName': 'serbest tempo', 'pace.groupName': '{pace} grubu', 'pace.ownLong': 'Serbest tempo', 'pace.groupLabel': 'Kilometrede {pace} dakika tempo grubu', 'pace.running': '{n} kişi',

  'run.rsvp': 'Katıl', 'run.in': 'Varım', 'run.cancelled': 'İptal', 'run.moved': 'Değişti', 'run.going': '{n} kişi geliyor', 'run.goingCaps': 'Geliyor', 'run.after': 'Sonrası: {what}',
  'run.youreIn': ', sen de geliyorsun', 'run.countMeIn': 'Ben de varım', 'run.youreInPace': 'Geliyorsun · {pace}', 'run.tapToCancel': 'Geliyorsun. İptal için dokun',
  'run.isCancelled': 'Bu koşu iptal edildi', 'run.changedBanner': 'Bu koşuda değişiklik var', 'run.details': '{title} ayrıntıları', 'run.detailsFallback': 'Koşu ayrıntıları',
  'run.meet': 'Buluşma', 'run.distance': 'Mesafe', 'run.surface': 'Zemin', 'run.afterLabel': 'Sonrası', 'run.pickPace': 'Tempo grubunu seç', 'run.chat': 'Koşu sohbeti', 'run.pinned': 'Sabitlendi',
  'run.messagePlaceholder': 'Gruba yaz', 'run.send': 'Gönder', 'run.sendLabel': 'Mesajı gönder', 'run.moreRunners': '{n} koşucu daha göster',
  'run.addCalendar': 'Takvime ekle', 'run.manage': 'Bu koşuyu yönet', 'run.meetMap': 'Buluşma · yol tarifi için dokun', 'run.meetMapLabel': 'Buluşma noktası: {place}. Haritada açılır.', 'run.mapPlaceholder': 'harita — {place}',

  'home.next': 'Sıradaki koşu · {day} {time}', 'home.startsIn': '{d} gün {h} saat {m} dakika sonra başlıyor',
  'home.days': 'Gün', 'home.hrs': 'Saat', 'home.min': 'Dk', 'home.sec': 'Sn',
  'home.comingUp': 'Yaklaşan koşular', 'home.noRuns': 'Henüz planlanmış koşu yok. Yenilemek için aşağı çek.', 'home.yourWeek': 'Senin haftan', 'home.logRun': 'Koşu ekle',
  'home.km': 'KM', 'home.runs': 'Koşu', 'home.moving': 'Süre', 'home.today': ', bugün', 'home.ran': 'koşuldu', 'home.noRun': 'koşu yok',
  'home.dayLetters': 'P,S,Ç,P,C,C,P', 'home.dayNames': 'Pazartesi,Salı,Çarşamba,Perşembe,Cuma,Cumartesi,Pazar',
  'home.challengeLine': '{n} gün kaldı. Kaydedilen her kilometre sayılır, tek başına koşular da.',

  'runs.title': 'Program', 'runs.sub': 'Haftada iki koşu, her birinin ardından kahve.', 'runs.weekly': 'Haftalık', 'runs.races': 'Yarışlar',
  'runs.noRaces': 'Takvimde henüz yarış yok.', 'runs.signedUp': '{n} kişi kayıtlı', 'runs.join': 'Katıl', 'runs.joined': 'Varım', 'runs.addRace': 'Yarış ekle', 'runs.signupPage': 'Kayıt sayfası', 'runs.removeRace': 'Kaldır',

  'stats.logged': '{km} km kayıtlı · {n} haftalık seri', 'stats.weekly': 'Haftalık km', 'stats.last8': 'Son 8 hafta', 'stats.empty': 'İlk koşunu ekle, haftaların dolmaya başlasın.',
  'stats.board': 'Sıralama', 'stats.rank': 'Bu ay {n}. sıradasın', 'stats.kmMonth': 'Bu ayın km’si', 'stats.boardEmpty': 'Bu ay henüz kimse koşu eklemedi.',
  'stats.percent': '%{n}', 'stats.ringLabel': 'Aylık hedefin yüzde {n} kadarı', 'stats.barsLabel': 'Haftalık kilometre, en eskiden başlayarak: {list}', 'stats.rowLabel': '{rank}. {name}, {km} kilometre',

  'feed.title': 'Akış', 'feed.write': 'Gönderi yaz', 'feed.empty': 'Burada henüz bir şey yok. İlk koşundan sonra nasıl geçtiğini yaz.',
  'feed.distance': 'Mesafe', 'feed.pace': 'Ort. tempo', 'feed.kudos': 'Alkış', 'feed.kudosOn': 'Alkış ✓', 'feed.kudosCount': '{n} alkış', 'feed.comments': '{n} yorum',
  'feed.giveKudos': 'Alkışla', 'feed.removeKudos': 'Alkışı geri al', 'feed.photo': 'fotoğraf',

  'comments.title': 'Yorumlar', 'comments.empty': 'Henüz yorum yok. İlk yorumu sen yaz.', 'comments.placeholder': 'Yorum ekle', 'comments.sendLabel': 'Yorumu gönder', 'comments.failed': 'Yorumun gönderilemedi', 'comments.loadFailed': 'Yorumlar yüklenemedi', 'comments.post': 'Gönderi',

  'compose.kicker': 'Grup akışına', 'compose.title': 'Yeni gönderi', 'compose.you': 'Sen', 'compose.now': 'Şimdi', 'compose.bwNote': 'Akışta olduğu gibi siyah beyaz gösterilir',
  'compose.change': 'Değiştir', 'compose.remove': 'Kaldır', 'compose.addPhoto': 'Fotoğraf ekle', 'compose.photoOptional': 'İsteğe bağlı. Fotoğrafsız da olur.', 'compose.how': 'Nasıl geçti?',
  'compose.placeholder': 'Zor antrenman, güzel kahve…', 'compose.bodyLabel': 'Yazmak istediklerin', 'compose.foot': 'Alkış ve yorumlar gruptan gelir.', 'compose.attach': 'Koşu ekle',
  'compose.attachHelp': 'Gönderiyi koşuyla etiketler, böylece grup hangi koşu olduğunu bilir.', 'compose.submit': 'Akışta paylaş', 'compose.busy': 'Paylaşılıyor…', 'compose.failed': 'Paylaşılamadı',
  'compose.photoDenied': 'Fotoğraf eklemek için Exa’nın fotoğraflarına erişmesi gerekiyor', 'compose.photoBlocked': 'Fotoğraf eklemek için Ayarlar’dan Exa’ya fotoğraf izni ver',

  'log.kicker': 'Senin haftan', 'log.title': 'Koşu ekle', 'log.today': 'Bugün', 'log.yesterday': 'Dün', 'log.distance': 'Mesafe · km', 'log.time': 'Koşu süresi · dakika', 'log.pace': 'Ortalama tempo',
  'log.distanceError': 'Mesafeyi kilometre olarak gir, örneğin 8,5', 'log.timeError': 'Süreyi dakika olarak gir, örneğin 45', 'log.submit': 'Koşuyu kaydet', 'log.busy': 'Kaydediliyor…', 'log.done': '{km} km kaydedildi', 'log.failed': 'Koşu kaydedilemedi. Girdiklerin duruyor.',

  'you.since': 'Üye #{n} · kayıt: {date}', 'you.paceGroup': 'Tempo grubu', 'you.clanRuns': 'Grup koşusu', 'you.kmYear': '{year} KM', 'you.minKm': 'dk/km', 'you.paceHelp': 'İstediğin zaman değiştir ya da Serbest’i seçip rahat ettiğin hızda koş. Kimse yalnız bitirmez.',
  'you.emergency': 'Acil durum kişisi', 'you.added': 'Eklendi', 'you.kit': 'Grup kıyafeti', 'you.notifications': 'Bildirimler', 'you.runDayChat': 'Koşu günü + yorumlar', 'you.runDay': 'Koşu günü', 'you.chat': 'Yorumlar', 'you.off': 'Kapalı', 'you.appearance': 'Görünüm', 'you.language': 'Dil',

  'settings.member': 'Üye #{n}', 'settings.title': 'Ayarlar', 'settings.appearance': 'Görünüm', 'settings.dark': 'Koyu', 'settings.light': 'Açık', 'settings.system': 'Sistem', 'settings.appearanceHelp': 'Sistem, telefonunun ayarını izler. Grubun kırmızısı değişmez.',
  'settings.language': 'Dil', 'settings.langSystem': 'Telefon', 'settings.langHelp': 'Telefon seçeneği, telefonunun dilini izler. Koşu bilgileri liderlerin yazdığı gibi görünür.',
  'settings.notifications': 'Bildirimler', 'settings.runDay': 'Koşu günü', 'settings.runDayHelp': 'Katıldığın koşulardan 12 saat önce hatırlatma, değişirse uyarı', 'settings.comments': 'Yorumlar', 'settings.commentsHelp': 'Biri gönderine yorum yaptığında',
  'settings.notifDenied': 'Telefonunun Ayarlar bölümünden Exa’ya bildirim izni ver',
  'settings.target': 'Aylık hedef · km', 'settings.targetLabel': 'Ayda {km} kilometre', 'settings.targetHelp': 'Bu ay şimdiye kadar {km} km. İstatistik’teki halka, bu hedefteki payını gösterir.', 'settings.targetHelpEmpty': 'İstatistik’teki halka, bu hedefteki payını gösterir.',
  'settings.kit': 'Grup kıyafeti · yelek bedeni', 'settings.emergency': 'Acil durum kişisi', 'settings.contactName': 'Ad', 'settings.contactPhone': 'Telefon', 'settings.contactHelp': 'Bir şey olursa diye, katıldığın koşularda koşu liderleri bunu görebilir.', 'settings.saveContact': 'Kişiyi kaydet',
  'settings.account': 'Hesap', 'settings.memberNumber': 'Üye numarası', 'settings.email': 'E-posta', 'settings.signOut': 'Çıkış yap', 'settings.signOutConfirm': 'Exa Running Clan’den çıkış yapılsın mı?',

  'manage.kicker': 'Lider araçları', 'manage.date': 'Bu tarih', 'manage.onTrack': 'Yapılacak', 'manage.statusChanged': 'Değişti', 'manage.statusCancelled': 'İptal', 'manage.notice': 'Koşuculara duyuru', 'manage.noticePlaceholder': 'Fırtına bekleniyor, bu yüzden kafeden başlıyoruz.',
  'manage.meetDate': 'Buluşma noktası, yalnızca bu tarih', 'manage.meetDateHelp': 'Her zamanki nokta için boş bırak.', 'manage.saveDate': 'Kaydet ve koşuculara bildir', 'manage.busy': 'Kaydediliyor…', 'manage.savedDate': 'Koşu güncellendi', 'manage.failed': 'Kaydedilemedi. Bağlantını kontrol edip tekrar dene.',
  'manage.weekly': 'Her hafta', 'manage.weeklyHelp': 'Saati değiştirmek yaklaşan tüm tarihleri taşır. Katılmış olanlar listede kalır.', 'manage.name': 'Koşunun adı', 'manage.time': 'Başlangıç saati · 24 saat', 'manage.timeError': '24 saat biçimi kullan, örneğin 19:00', 'manage.place': 'Buluşma noktası', 'manage.placeError': 'Buluşma noktası gir', 'manage.nameError': 'Bir ad gir',
  'manage.location': 'Harita konumu', 'manage.locationHelp': 'Koordinat (35.33, 33.31) ya da tam Google Maps bağlantısı yapıştır. Harita istemiyorsan boş bırak.', 'manage.locationError': 'Burada koordinat yok. Google Haritalar’da noktaya basılı tutup sayıları kopyala.', 'manage.after': 'Koşudan sonra', 'manage.description': 'Açıklama', 'manage.saveWeekly': 'Haftalık bilgileri kaydet', 'manage.savedWeekly': 'Haftalık bilgiler kaydedildi',
  'manage.contacts': 'Acil durum kişileri', 'manage.contactsHelp': 'Bu tarihe gelen herkes. Bu bilgileri gizli tut.', 'manage.noContact': 'Kişi eklenmemiş', 'manage.nobody': 'Henüz kimse katılmadı.', 'manage.callLabel': '{name} kişisini ara', 'manage.notAllowed': 'Koşuları yalnızca liderler yönetebilir.', 'manage.contactsFailed': 'Kişiler yüklenemedi',

  'race.kicker': 'Lider araçları', 'race.title': 'Yarış ekle', 'race.name': 'Yarışın adı', 'race.date': 'Tarih · YYYY-AA-GG', 'race.location': 'Yer', 'race.note': 'Not', 'race.link': 'Kayıt bağlantısı', 'race.nameError': 'Yarışın adını gir', 'race.dateError': 'Tarihi 2027-03-15 gibi yaz', 'race.submit': 'Yarışı ekle', 'race.busy': 'Ekleniyor…', 'race.failed': 'Yarış eklenemedi',

  'toast.rsvpFailed': 'Katılımın kaydedilemedi. Bağlantını kontrol et.', 'toast.paceFailed': 'Tempo grubun değiştirilemedi', 'toast.settingFailed': 'Bu ayar kaydedilemedi', 'toast.kudosFailed': 'Alkış gönderilemedi', 'toast.messageFailed': 'Mesajın gönderilemedi', 'toast.refreshFailed': 'Yenilenemedi. Son güncelleme gösteriliyor.', 'toast.raceFailed': 'Yarış kaydın güncellenemedi',

  'notif.title': '{title} yaklaşıyor', 'notif.body': '{day} {time}. {place}',
};
