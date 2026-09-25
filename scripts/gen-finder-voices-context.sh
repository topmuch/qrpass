#!/bin/bash
# Voix trouveur adaptées par contexte :
#  - Bracelet Identity trouvé (/p/[code]) : urgence pèlerin → guidance secours/famille/chef
#  - Passeport trouvé (/scan-passeport) : document perdu → contacter le propriétaire
# API TTS refuse mp3 direct → WAV puis ffmpeg libmp3lame
set -e
cd /home/z/my-project/qrpass

# ─── IDENTITY (bracelet pèlerin trouvé) ───
z-ai tts -f wav \
  -i "Bonjour ! Vous avez trouvé le bracelet d'un pèlerin. Ce bracelet est protégé par l'Organe de la Gestion du Pèlerinage. Rassurez-vous, tout est prévu. Restez auprès du pèlerin. Sur cette page, vous pouvez appeler le chef de groupe, contacter la famille, ou appeler les secours en cas d'urgence médicale. Merci pour votre aide précieuse." \
  -o /tmp/identity-finder-fr.wav -v tongtong -s 1.0

z-ai tts -f wav \
  -i "Hello! You have found a pilgrim's bracelet. This bracelet is protected by the Hajj Management Authority. Don't worry, everything is taken care of. Please stay with the pilgrim. On this page, you can call the group leader, contact the family, or call emergency services in case of a medical emergency. Thank you for your precious help." \
  -o /tmp/identity-finder-en.wav -v tongtong -s 1.0

z-ai tts -f wav \
  -i "مرحباً! لقد عثرت على سوار حاج. هذا السوار محمي من قبل هيئة إدارة الحج. اطمئن، كل شيء مدبّر. ابقَ بجانب الحاج. من هذه الصفحة يمكنك الاتصال برائد المجموعة أو بالعائلة أو بالطوارئ عند الحاجة الطبية. شكراً لمساعدتك الثمينة." \
  -o /tmp/identity-finder-ar.wav -v tongtong -s 1.0

# ─── PASSEPORT (document trouvé) ───
z-ai tts -f wav \
  -i "Bonjour ! Vous avez trouvé un passeport protégé par l'Organe de la Gestion du Pèlerinage. Merci de votre aide. Restez sur cette page et cliquez sur le bouton « Contacter le propriétaire » pour remplir vos informations. Le propriétaire sera informé immédiatement pour venir récupérer son passeport. Merci beaucoup." \
  -o /tmp/passeport-finder-fr.wav -v tongtong -s 1.0

z-ai tts -f wav \
  -i "Hello! You have found a passport protected by the Hajj Management Authority. Thank you for your help. Stay on this page and tap the button 'Contact the owner' to fill in your details. The owner will be notified immediately to come and retrieve their passport. Thank you very much." \
  -o /tmp/passeport-finder-en.wav -v tongtong -s 1.0

z-ai tts -f wav \
  -i "مرحباً! لقد عثرت على جواز سفر محمي من قبل هيئة إدارة الحج. شكراً لمساعدتك. ابقَ في هذه الصفحة واضغط على زر «تواصل مع المالك» لإدخال معلوماتك. سيتم إبلاغ المالك فوراً لاستعادة جواز سفره. شكراً جزيلاً." \
  -o /tmp/passeport-finder-ar.wav -v tongtong -s 1.0

# ─── Conversion MP3 ───
for f in identity-finder-fr identity-finder-en identity-finder-ar passeport-finder-fr passeport-finder-en passeport-finder-ar; do
  ffmpeg -y -i "/tmp/$f.wav" -codec:a libmp3lame -qscale:a 4 "public/audio/$f.mp3" -loglevel error
done

echo "=== Generated files ==="
for f in public/audio/identity-finder-*.mp3 public/audio/passeport-finder-*.mp3; do
  d=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$f")
  echo "$f : ${d%.*} s"
done
