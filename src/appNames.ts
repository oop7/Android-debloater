const KNOWN_PACKAGES: Record<string, string> = {
  // Accessibility
  'com.google.android.marvin.talkback': 'Android Accessibility Suite',
  'com.google.android.accessibility.soundamplifier': 'Sound Amplifier',
  'com.google.audio.hearing.visualization.accessibility.scribe': 'Live Transcribe',
  'com.google.android.apps.accessibility.voiceaccess': 'Voice Access',

  // Google Core & Apps
  'com.android.chrome': 'Google Chrome',
  'com.google.android.youtube': 'YouTube',
  'com.google.android.apps.youtube.music': 'YouTube Music',
  'com.google.android.gms': 'Google Play Services',
  'com.google.android.vending': 'Google Play Store',
  'com.google.android.googlequicksearchbox': 'Google App',
  'com.google.android.apps.maps': 'Google Maps',
  'com.google.android.gm': 'Gmail',
  'com.google.android.apps.docs': 'Google Drive',
  'com.google.android.apps.photos': 'Google Photos',
  'com.google.android.calendar': 'Google Calendar',
  'com.google.android.contacts': 'Google Contacts',
  'com.google.android.deskclock': 'Google Clock',
  'com.google.android.apps.messaging': 'Google Messages',
  'com.google.android.dialer': 'Phone by Google',
  'com.google.android.inputmethod.latin': 'Gboard',
  'com.google.android.keep': 'Google Keep',
  'com.google.android.videos': 'Google TV',
  'com.google.android.apps.tachyon': 'Google Meet',
  'com.google.android.apps.walletnfcrel': 'Google Wallet',
  'com.google.android.tts': 'Speech Recognition & Synthesis',
  'com.google.android.apps.nbu.files': 'Files by Google',
  'com.google.android.calculator': 'Google Calculator',
  'com.google.android.podcasts': 'Google Podcasts',

  // Standard Android System
  'com.android.settings': 'Settings',
  'com.android.camera': 'Camera',
  'com.android.phone': 'Phone',
  'com.android.dialer': 'Dialer',
  'com.android.contacts': 'Contacts',
  'com.android.mms': 'Messaging',
  'com.android.calculator2': 'Calculator',
  'com.android.deskclock': 'Clock',
  'com.android.gallery3d': 'Gallery',
  'com.android.bluetooth': 'Bluetooth',
  'com.android.stk': 'SIM Toolkit',
  'com.android.providers.downloads.ui': 'Downloads',
  'com.android.printspooler': 'Print Spooler',
  'com.android.htmlviewer': 'HTML Viewer',

  // Samsung Apps & Bloatware
  'com.sec.android.app.sbrowser': 'Samsung Internet',
  'com.sec.android.app.popupcalculator': 'Samsung Calculator',
  'com.sec.android.app.clockpackage': 'Samsung Clock',
  'com.sec.android.app.voicenote': 'Samsung Voice Recorder',
  'com.sec.android.gallery3d': 'Samsung Gallery',
  'com.sec.android.app.myfiles': 'Samsung My Files',
  'com.samsung.android.bixby.agent': 'Bixby Voice',
  'com.samsung.android.bixby.wakeup': 'Bixby Wakeup',
  'com.samsung.android.app.spage': 'Samsung Free',
  'com.samsung.android.game.gamehome': 'Gaming Hub',
  'com.samsung.android.game.gametools': 'Game Booster',
  'com.samsung.android.app.notes': 'Samsung Notes',
  'com.samsung.android.email.provider': 'Samsung Email',
  'com.samsung.android.calendar': 'Samsung Calendar',
  'com.samsung.android.messaging': 'Samsung Messages',
  'com.samsung.android.pay': 'Samsung Pay',
  'com.samsung.android.health': 'Samsung Health',
  'com.samsung.android.wearable.app': 'Galaxy Wearable',
  'com.samsung.android.dialer': 'Samsung Phone',
  'com.samsung.android.oneconnect': 'SmartThings',

  // Xiaomi Apps
  'com.miui.securitycenter': 'Xiaomi Security',
  'com.miui.calculator': 'Mi Calculator',
  'com.miui.gallery': 'Mi Gallery',
  'com.miui.player': 'Mi Music',
  'com.miui.videoplayer': 'Mi Video',
  'com.miui.cleanmaster': 'Cleaner',
  'com.miui.weather2': 'Mi Weather',
  'com.miui.notes': 'Mi Notes',
  'com.mi.android.globalminstore': 'GetApps',
  'com.xiaomi.midrop': 'ShareMe',
  'com.miui.compass': 'Mi Compass',

  // Popular Third-Party Apps & Pre-installed Bloatware
  'com.facebook.katana': 'Facebook',
  'com.facebook.system': 'Facebook App Installer',
  'com.facebook.appmanager': 'Facebook App Manager',
  'com.facebook.services': 'Facebook Services',
  'com.facebook.orca': 'Messenger',
  'com.instagram.android': 'Instagram',
  'com.whatsapp': 'WhatsApp',
  'com.twitter.android': 'X (Twitter)',
  'com.zhiliaoapp.musically': 'TikTok',
  'com.ss.android.ugc.trill': 'TikTok',
  'com.netflix.mediaclient': 'Netflix',
  'com.netflix.partner.activation': 'Netflix Partner Activation',
  'com.spotify.music': 'Spotify',
  'com.amazon.mShop.android.shopping': 'Amazon Shopping',
  'com.amazon.mp3': 'Amazon Music',
  'com.amazon.kindle': 'Amazon Kindle',
  'com.microsoft.office.outlook': 'Microsoft Outlook',
  'com.microsoft.office.onedrive': 'Microsoft OneDrive',
  'com.microsoft.skydrive': 'OneDrive',
  'com.microsoft.office.officehubrow': 'Microsoft 365',
  'com.linkedin.android': 'LinkedIn',
  'com.ebay.mobile': 'eBay',
  'com.booking': 'Booking.com',
};

export function humanizePackageName(pkg: string): string {
  if (!pkg) return '';
  const parts = pkg.split('.').filter(Boolean);
  if (parts.length === 0) return pkg;

  // Filter out common reverse domain tokens
  const ignorePrefixes = new Set(['com', 'org', 'net', 'io', 'gov', 'edu', 'android', 'sec', 'samsung', 'miui', 'google']);
  let meaningful = parts.filter(p => !ignorePrefixes.has(p.toLowerCase()));
  if (meaningful.length === 0) {
    meaningful = parts;
  }

  const rawName = meaningful.join(' ');

  const words = rawName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_.-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function getFriendlyName(pkg: string, providedName?: string): string {
  if (providedName && providedName.trim() !== '' && providedName.trim() !== pkg) {
    return providedName.trim();
  }
  if (KNOWN_PACKAGES[pkg]) {
    return KNOWN_PACKAGES[pkg];
  }
  return humanizePackageName(pkg);
}
