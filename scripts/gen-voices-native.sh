#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# Régénération TOUTES les voix avec edge-tts (voix NATURELLES natives)
#  - FR : fr-FR-DeniseNeural   (française native — remplace tongtong chinoise)
#  - EN : en-GB-SoniaNeural    (anglais britannique natif « bon anglais »)
#  - AR : ar-SA-ZariyahNeural  (arabe natif)
#  - WO : conserve l'audio tongtong existant, normalisation volume seule
# Puis loudnorm -16 LUFS (corrige « voix inaudibles »)
# ═══════════════════════════════════════════════════════════════════
set -e
cd /home/z/my-project/qrpass
EDGE="$HOME/.local/bin/edge-tts"
AUD=public/audio
TMP=/tmp/voices-native
mkdir -p "$TMP"

norm() { # normalisation loudness broadcast + mp3 VBR qualité
  ffmpeg -y -i "$1" -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 24000 \
    -codec:a libmp3lame -qscale:a 4 "$2" -loglevel error
}

speak() { # voice text outfile
  $EDGE --voice "$1" --rate=-5% --text "$2" --write-media "$3" 2>/dev/null
}

# ─── 1. CONFIRMATION (page /activate/confirmation) — FR Denise ───
speak fr-FR-DeniseNeural \
"Félicitations ! Votre bracelet Pass Hadj Identité est maintenant activé. Voici quelques conseils importants. Portez votre bracelet en permanence pendant tout le pèlerinage. Conservez précieusement votre code de référence. En cas de malaise, les secours scanneront votre bracelet, et votre chef de groupe recevra une alerte WhatsApp immédiate. Bon pèlerinage, et qu'Allah accepte votre voyage !" \
"$TMP/confirmation-voice-identity.mp3"

speak fr-FR-DeniseNeural \
"Félicitations ! Votre bagage est maintenant protégé par Pass Hadj. Voici quelques conseils importants. Collez l'étiquette QR code sur votre valise, de façon bien visible. Conservez précieusement votre code de référence. Si votre bagage est perdu, la personne qui le retrouvera n'aura qu'à scanner le QR code, et votre chef de groupe recevra une alerte WhatsApp immédiate. Bon voyage, et qu'Allah accepte votre pèlerinage !" \
"$TMP/confirmation-voice-baggage.mp3"

speak fr-FR-DeniseNeural \
"Félicitations ! Votre Pass Passeport est maintenant activé. Voici quelques conseils importants. Collez le sticker QR code sur la couverture de votre passeport. Conservez précieusement votre code de référence. Si votre passeport est perdu, la personne qui le retrouvera n'aura qu'à scanner le QR code, et vous recevrez une notification WhatsApp immédiate. Bon pèlerinage, et qu'Allah accepte votre voyage !" \
"$TMP/confirmation-voice-passeport.mp3"

# ─── 2. TROUVEUR BAGAGE (page /scan/[reference]) — FR / EN / AR ───
speak fr-FR-DeniseNeural \
"Bonjour ! Vous avez trouvé un bagage protégé par Pass Hadj, le service officiel de protection des bagages. Merci de votre geste. Sur cette page, vous pouvez contacter directement le propriétaire par WhatsApp ou par téléphone. Vous pouvez aussi déposer le bagage à l'hôtel du propriétaire, ou appuyer sur le bouton vert pour signaler le bagage comme retrouvé. Merci beaucoup pour votre aide." \
"$TMP/finder-voice-fr.mp3"

speak en-GB-SoniaNeural \
"Hello! You have found a bag protected by PassHajj, the official baggage protection service. Thank you for your kind gesture. On this page, you can contact the owner directly via WhatsApp or phone. You can also drop the bag at the owner's hotel, or tap the green button to mark it as found. Thank you very much for your help." \
"$TMP/finder-voice-en.mp3"

speak ar-SA-ZariyahNeural \
"مرحباً! لقد عثرت على حقيبة محمية من قبل الخدمة الرسمية لحماية الحقائب. شكراً لك. في هذه الصفحة، يمكنك الاتصال بالمالك مباشرة عبر واتساب أو الهاتف. يمكنك أيضاً تسليم الحقيبة في فندق المالك، أو الضغط على الزر الأخضر للإبلاغ عن العثور عليها. شكراً جزيلاً على مساعدتك." \
"$TMP/finder-voice-ar.mp3"

# ─── 3. TROUVEUR IDENTITY (page /p/[code]) — FR / EN / AR ───
speak fr-FR-DeniseNeural \
"Bonjour ! Vous avez trouvé le bracelet d'un pèlerin. Ce bracelet est protégé par l'Organe de la Gestion du Pèlerinage. Rassurez-vous, tout est prévu. Restez auprès du pèlerin. Sur cette page, vous pouvez appeler le chef de groupe, contacter la famille, ou appeler les secours en cas d'urgence médicale. Merci pour votre aide précieuse." \
"$TMP/identity-finder-fr.mp3"

speak en-GB-SoniaNeural \
"Hello! You have found a pilgrim's bracelet. This bracelet is protected by the Hajj Management Authority. Don't worry, everything is taken care of. Please stay with the pilgrim. On this page, you can call the group leader, contact the family, or call emergency services in case of a medical emergency. Thank you for your precious help." \
"$TMP/identity-finder-en.mp3"

speak ar-SA-ZariyahNeural \
"مرحباً! لقد عثرت على سوار حاج. هذا السوار محمي من قبل هيئة إدارة الحج. اطمئن، كل شيء مدبّر. ابقَ بجانب الحاج. من هذه الصفحة يمكنك الاتصال برائد المجموعة أو بالعائلة أو بالطوارئ عند الحاجة الطبية. شكراً لمساعدتك الثمينة." \
"$TMP/identity-finder-ar.mp3"

# ─── 4. TROUVEUR PASSEPORT (page /scan-passeport) — FR / AR ───
speak fr-FR-DeniseNeural \
"Bonjour ! Vous avez trouvé un passeport protégé par l'Organe de la Gestion du Pèlerinage. Merci de votre aide. Restez sur cette page et appuyez sur le bouton « Contacter le propriétaire » pour remplir vos informations. Le propriétaire sera informé immédiatement pour venir récupérer son passeport. Merci beaucoup." \
"$TMP/passeport-finder-fr.mp3"

speak ar-SA-ZariyahNeural \
"مرحباً! لقد عثرت على جواز سفر محمي من قبل هيئة إدارة الحج. شكراً لمساعدتك. ابقَ في هذه الصفحة واضغط على زر «تواصل مع المالك» لإدخال معلوماتك. سيتم إبلاغ المالك فوراً لاستعادة جواز سفره. شكراً جزيلاً." \
"$TMP/passeport-finder-ar.mp3"

# ─── 5. Normalisation + déploiement des 11 fichiers ───
for f in confirmation-voice-identity confirmation-voice-baggage confirmation-voice-passeport \
         finder-voice-fr finder-voice-en finder-voice-ar \
         identity-finder-fr identity-finder-en identity-finder-ar \
         passeport-finder-fr passeport-finder-ar; do
  norm "$TMP/$f.mp3" "$AUD/$f.mp3"
  echo "✓ $f.mp3"
done

# ─── 6. WOLOF : conserve l'audio existant, normalisation volume seule ───
norm "$AUD/passeport-finder-wo.mp3" "$TMP/passeport-finder-wo-norm.mp3"
mv "$TMP/passeport-finder-wo-norm.mp3" "$AUD/passeport-finder-wo.mp3"
echo "✓ passeport-finder-wo.mp3 (volume normalisé, voix conservée)"

echo ""
echo "=== Récapitulatif (durée / volume moyen / pic) ==="
for f in $AUD/*.mp3; do
  d=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$f")
  v=$(ffmpeg -i "$f" -af volumedetect -f null - 2>&1 | rg -o "mean_volume: [-0-9.]+ dB")
  echo "$(basename $f) : ${d%.*} s | $v"
done
