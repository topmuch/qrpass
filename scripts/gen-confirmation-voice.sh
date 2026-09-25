#!/bin/bash
# Génération des guides vocaux de la page de confirmation /activate/confirmation (FR)
# API TTS ne supporte pas mp3 → WAV puis conversion ffmpeg
set -e
cd /home/z/my-project/qrpass

z-ai tts -f wav \
  -i "Félicitations ! Votre bracelet Pass Hajj Identity est maintenant activé. Voici quelques conseils importants. Portez votre bracelet en permanence pendant tout le pèlerinage. Conservez précieusement votre code de référence. En cas de malaise, les secours scanneront votre bracelet, et votre chef de groupe recevra une alerte WhatsApp immédiate. Bon pèlerinage, et qu'Allah accepte votre voyage !" \
  -o /tmp/confirmation-voice-identity.wav -v tongtong -s 1.0

z-ai tts -f wav \
  -i "Félicitations ! Votre bagage est maintenant protégé par Pass Hajj. Voici quelques conseils importants. Collez l'étiquette QR code sur votre valise, de façon bien visible. Conservez précieusement votre code de référence. Si votre bagage est perdu, la personne qui le retrouvera n'aura qu'à scanner le QR code, et votre chef de groupe recevra une alerte WhatsApp immédiate. Bon voyage, et qu'Allah accepte votre pèlerinage !" \
  -o /tmp/confirmation-voice-baggage.wav -v tongtong -s 1.0

z-ai tts -f wav \
  -i "Félicitations ! Votre Pass Passeport est maintenant activé. Voici quelques conseils importants. Collez le sticker QR code sur la couverture de votre passeport. Conservez précieusement votre code de référence. Si votre passeport est perdu, la personne qui le retrouvera n'aura qu'à scanner le QR code, et vous recevrez une notification WhatsApp immédiate. Bon pèlerinage, et qu'Allah accepte votre voyage !" \
  -o /tmp/confirmation-voice-passeport.wav -v tongtong -s 1.0

for t in identity baggage passeport; do
  ffmpeg -y -i "/tmp/confirmation-voice-$t.wav" -codec:a libmp3lame -qscale:a 4 "public/audio/confirmation-voice-$t.mp3" -loglevel error
done

echo "=== Generated files ==="
for f in public/audio/confirmation-voice-*.mp3; do
  d=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$f")
  echo "$f : ${d%.*} s"
done
