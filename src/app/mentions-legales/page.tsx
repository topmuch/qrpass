import PublicLayout from '@/components/public/PublicLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales du site PassHajj - Protection intelligente des bagages.',
};

export default function MentionsLegales() {
  return (
    <PublicLayout>
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-8">Mentions légales</h1>
          
          <div className="space-y-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Éditeur du site</h2>
              <p className="mb-4">
                Le site PassHajj est édité par la société <strong>New Vision Cargo</strong>, spécialisée dans la protection intelligente pour le Hajj et l&apos;Omrah. Numéro d&apos;immatriculation au Registre du Commerce et du Crédit Mobilier (RCCM) de N&apos;Djaména : disponible sur demande.
              </p>
              <p>
                <strong>Siège social :</strong> Avenue Charles de Gaulle, N&apos;Djaména, Tchad<br />
                <strong>Téléphone :</strong> +235 66 35 25 05 · +235 95 72 99 99<br />
                <strong>Email :</strong> contact@newvisioncargo.pro<br />
                <strong>Site web :</strong> newvisioncargo.pro · passhajj.qrbags.com<br />
                <strong>Directeur de la publication :</strong> La Direction de New Vision Cargo
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Hébergement</h2>
              <p>
                Le site est hébergé sur une infrastructure cloud sécurisée, avec chiffrement des échanges (HTTPS) et sauvegardes régulières. Pour toute question relative à l&apos;hébergement, contactez-nous à : contact@newvisioncargo.pro.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Propriété intellectuelle</h2>
              <p className="mb-4">
                L&apos;ensemble du contenu du site PassHajj (textes, images, vidéos, logos, icônes, sons, logiciels, etc.) est la propriété exclusive de New Vision Cargo ou de ses partenaires et est protégé par les lois tchadiennes et internationales relatives à la propriété intellectuelle.
              </p>
              <p>
                Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de New Vision Cargo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Données personnelles</h2>
              <p className="mb-4">
                Les informations concernant la collecte et le traitement des données personnelles sont détaillées dans notre <a href="/confidentialite" className="text-[#b8860b] hover:underline">Politique de confidentialité</a>.
              </p>
              <p>
                Conformément à la réglementation en vigueur sur la protection des données personnelles (dont le RGPD), vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression et de portabilité de vos données personnelles. Pour exercer ces droits, vous pouvez nous contacter à : contact@newvisioncargo.pro.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Cookies</h2>
              <p className="mb-4">
                Le site PassHajj utilise des cookies pour améliorer l&apos;expérience utilisateur. Ces cookies sont soumis à votre consentement préalable, conformément à la réglementation applicable.
              </p>
              <p>
                Pour en savoir plus sur l&apos;utilisation des cookies, veuillez consulter notre <a href="/confidentialite" className="text-[#b8860b] hover:underline">Politique de confidentialité</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Limitation de responsabilité</h2>
              <p className="mb-4">
                New Vision Cargo s&apos;efforce d&apos;assurer au mieux l&apos;exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, New Vision Cargo ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations mises à disposition sur ce site.
              </p>
              <p>
                En conséquence, New Vision Cargo décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur le site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Droit applicable</h2>
              <p>
                Les présentes mentions légales sont soumises au droit tchadien. En cas de litige et à défaut d&apos;accord amiable, le litige sera porté devant les tribunaux compétents de N&apos;Djaména, Tchad, conformément aux règles de compétence en vigueur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Contact</h2>
              <p>
                Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter :
              </p>
              <p>
                <strong>Email :</strong> <a href="mailto:contact@newvisioncargo.pro" className="text-[#b8860b] hover:underline">contact@newvisioncargo.pro</a><br />
                <strong>Téléphone :</strong> +235 66 35 25 05 · +235 95 72 99 99<br />
                <strong>Adresse :</strong> Avenue Charles de Gaulle, N&apos;Djaména, Tchad<br />
                <strong>Horaires :</strong> Lundi - Vendredi : 8h00 - 18h00 · Samedi : 9h00 - 13h00
              </p>
              <p className="mt-4">
                Vous pouvez également nous écrire sur WhatsApp : <a href="https://wa.me/23566352505" target="_blank" rel="noopener noreferrer" className="text-[#b8860b] hover:underline">+235 66 35 25 05</a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-[#1a2238]">
            <p className="text-[#a0a8b8] text-sm">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
