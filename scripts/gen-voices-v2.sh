#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# V2 — Textes DIRECTS validés par le client (26/09/2026)
#  - N°1,2,3,4,7,10 : corrections client (FR)
#  - N°5,6,8,9,11   : miroir EN/AR des corrections FR
#  - N°12 (wolof)   : INCHANGÉ (pas de voix wolof edge-tts)
# Mêmes noms de fichiers → zéro modification de code.
# ═══════════════════════════════════════════════════════════════════
set -e
cd /home/z/my-project/qrpass
EDGE="$HOME/.local/bin/edge-tts"
AUD=public/audio
TMP=/tmp/voices-v2
mkdir -p "$TMP"

norm() { # normalisation loudness broadcast + mp3 VBR qualité
  ffmpeg -y -i "$1" -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 24000 \
    -codec:a libmp3lame -qscale:a 4 "$2" -loglevel error
}

speak() { # voice text outfile
  $EDGE --voice "$1" --rate=-5% --text "$2" --write-media "$3" 2>/dev/null
}

gen() { # voice text outfile → génère + normalise + déploie
  local voice="$1" text="$2" out="$3"
  speak "$voice" "$text" "$TMP/$out"
  norm "$TMP/$out" "$AUD/$out"
  echo "✓ $out"
}

# ─── A. CONFIRMATION (page /activate/confirmation) — FR Denise ───
gen fr-FR-DeniseNeural \
"Votre Pass identité est activé ! Portez-le en permanence. Si vous êtes en difficulté, il suffit de le scanner : votre chef de groupe est alerté immédiatement. Bon pèlerinage, qu'Allah accepte votre voyage !" \
confirmation-voice-identity.mp3

gen fr-FR-DeniseNeural \
"Votre bagage est protégé ! Collez l'étiquette QR bien visible sur votre valise. Si vous le perdez, quiconque le scanne alerte votre chef de groupe immédiatement, ou le dépose à l'hôtel. Bon voyage, qu'Allah accepte votre pèlerinage !" \
confirmation-voice-baggage.mp3

gen fr-FR-DeniseNeural \
"Votre Pass Passeport est activé ! Collez le sticker sur la couverture de votre passeport. Si vous le perdez, quiconque le scanne vous alerte immédiatement sur WhatsApp, ou le dépose à l'hôtel. Bon pèlerinage, qu'Allah accepte votre voyage !" \
confirmation-voice-passeport.mp3

# ─── B. TROUVEUR BAGAGE (page /scan/[reference]) — FR / EN / AR ───
gen fr-FR-DeniseNeural \
"Bonjour ! Vous avez trouvé un bagage protégé. Merci de votre geste ! Deux options : contactez le propriétaire ci-dessous, ou appuyez sur le bouton vert — il sera alerté immédiatement. Merci beaucoup !" \
finder-voice-fr.mp3

gen en-GB-SoniaNeural \
"Hello! You've found a protected bag. Thank you for your kind gesture! Two options: contact the owner below, or tap the green button — they'll be alerted instantly. Thank you so much!" \
finder-voice-en.mp3

gen ar-SA-ZariyahNeural \
"مرحباً! لقد عثرت على حقيبة محمية. شكراً لمبادرتك! خياران: تواصل مع المالك بالأسفل، أو اضغط الزر الأخضر ليصل إليه التنبيه فوراً. شكراً جزيلاً!" \
finder-voice-ar.mp3

# ─── C. TROUVEUR PASS IDENTITÉ (page /p/[code]) — FR / EN / AR ───
gen fr-FR-DeniseNeural \
"Vous avez trouvé un pèlerin en difficulté. Rassurez-vous, tout est prévu ! Restez auprès de lui, puis appelez le chef de groupe ou les secours ci-dessous. Merci pour votre aide !" \
identity-finder-fr.mp3

gen en-GB-SoniaNeural \
"You've found a pilgrim in difficulty. Don't worry, everything is taken care of! Stay with them, then call the group leader or emergency services below. Thank you for your help!" \
identity-finder-en.mp3

gen ar-SA-ZariyahNeural \
"لقد عثرت على حاج في وضع صعب. اطمئن، كل شيء مدبّر! ابقَ بجانبه، ثم اتصل برائد المجموعة أو بالطوارئ بالأسفل. شكراً لمساعدتك!" \
identity-finder-ar.mp3

# ─── D. TROUVEUR PASSEPORT (page /scan-passeport) — FR / AR ───
gen fr-FR-DeniseNeural \
"Bonjour ! Vous avez trouvé un passeport protégé. Merci beaucoup ! Appuyez sur \"Contacter le propriétaire\" et remplissez le formulaire : il sera alerté immédiatement pour venir le récupérer." \
passeport-finder-fr.mp3

gen ar-SA-ZariyahNeural \
"مرحباً! لقد عثرت على جواز سفر محمي. شكراً جزيلاً! اضغط \"تواصل مع المالك\" وأدخل معلوماتك ليتم تنبيهه فوراً ليأتي لاستلام جوازه." \
passeport-finder-ar.mp3

echo ""
echo "=== Récapitulatif (durée / volume moyen) ==="
for f in confirmation-voice-identity confirmation-voice-baggage confirmation-voice-passeport \
         finder-voice-fr finder-voice-en finder-voice-ar \
         identity-finder-fr identity-finder-en identity-finder-ar \
         passeport-finder-fr passeport-finder-ar; do
  d=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUD/$f.mp3")
  v=$(ffmpeg -i "$AUD/$f.mp3" -af volumedetect -f null - 2>&1 | rg -o "mean_volume: [-0-9.]+ dB")
  echo "$f.mp3 : ${d%.*} s | $v"
done
echo ""
echo "passeport-finder-wo.mp3 : inchangé (voix wolof conservée)"
