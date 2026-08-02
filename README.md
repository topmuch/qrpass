# QRPass 🕌

**Pass Bagage & Pass Identity — Plateforme pour pèlerins Hajj & Omrah**

QRPass est une application web moderne offrant deux services essentiels aux pèlerins :
- **Pass Bagage** — Protection intelligente des bagages avec QR codes
- **Pass Identity** — Bracelet d'identité numérique pour pèlerins

Sans application, sans batterie, sans GPS — un simple scan suffit.

## ✨ Fonctionnalités

### Pass Bagage 🎒
- 📦 **Génération de QR codes** — Étiquettes uniques pour bagages
- 📱 **Scan sans application** — Fonctionne avec n'importe quel smartphone
- 📍 **Géolocalisation** — Localisation instantanée du scanner
- 💳 **Paiement PayPal** — Intégration complète PayPal (sandbox/production)

### Pass Identity 🪪
- 🆔 **Bracelet d'identité** — QR code lié au profil pèlerin
- 🏥 **Infos médicales** — Groupe sanguin, allergies, traitements
- 🏨 **Hébergement** — Hôtel & chambre à La Mecque et Médine
- 📞 **Contacts urgence** — Chef de groupe, agence, famille
- 🔍 **Signalement** — Trouver un pèlerin en difficulté

### Communs
- 🏠 **Dashboard Admin** — Gestion complète des utilisateurs, agences et commandes
- 📧 **Emails automatiques** — Confirmations et QR codes par email
- 🌍 **Multi-langues** — Support Français, Anglais, Arabe (RTL)
- 🕌 **Mode Hajj** — Gestion spéciale pour les pèlerinages

## 🚀 Déploiement sur Coolify

### Prérequis

- Un serveur avec [Coolify](https://coolify.io/) installé
- Un compte GitHub

### Étapes de déploiement

#### 1. Sur Coolify

1. Créer une nouvelle ressource **"Docker"**
2. Sélectionner **"Git Repository"**
3. Entrer l'URL : `https://github.com/topmuch/qrpass.git`
4. Configurer les variables d'environnement :

```env
DATABASE_URL=file:/app/data/qrpass.db
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com
NEXTAUTH_SECRET=votre-cle-nextauth-32chars
ENCRYPTION_KEY=votre-cle-encryption-32chars
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=votre-client-id
PAYPAL_CLIENT_SECRET=votre-client-secret
```

5. Définir le port : `3000`
6. Déployer !

### Variables d'environnement requises

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `DATABASE_URL` | Chemin vers la base SQLite | ✅ |
| `NEXT_PUBLIC_BASE_URL` | URL publique de l'application | ✅ |
| `NEXTAUTH_SECRET` | Clé secrète NextAuth (32+ caractères) | ✅ |
| `ENCRYPTION_KEY` | Clé de chiffrement (32+ caractères) | ✅ |
| `PAYPAL_CLIENT_ID` | ID client PayPal | ✅ |
| `PAYPAL_CLIENT_SECRET` | Secret PayPal | ✅ |
| `PAYPAL_MODE` | `sandbox` ou `live` | ✅ |

## 🛠️ Développement local

### Prérequis

- Node.js 20+ ou Bun
- npm, yarn ou bun

### Installation

```bash
# Cloner le repository
git clone https://github.com/topmuch/qrpass.git
cd qrpass

# Installer les dépendances
bun install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Initialiser la base de données
bun run db:push
bun run db:generate

# Lancer en développement
bun run dev
```

### Identifiants de démonstration

- **Admin:** `admin@qrpass.com` / `admin123`
- **Agence:** `agency@qrpass.com` / `agency123`

## 📁 Structure du projet

```
qrpass/
├── prisma/           # Schéma et seed de la base de données
├── public/           # Assets statiques
├── src/
│   ├── app/          # Pages Next.js (App Router)
│   │   ├── api/      # Routes API
│   │   │   └── pilgrims/  # Pass Identity API
│   │   ├── b/[code]/      # Pass Bagage scan
│   │   ├── p/[code]/      # Pass Identity scan
│   │   ├── found/[code]/  # Sélecteur Bagage/Identity
│   │   ├── admin/         # Dashboard admin
│   │   └── ...
│   ├── components/   # Composants React
│   └── lib/          # Utilitaires et configurations
├── Dockerfile        # Image Docker pour Coolify
├── docker-compose.yml
└── package.json
```

## 🔧 Stack technique

- **Framework:** Next.js 16 (App Router)
- **Base de données:** SQLite (Prisma ORM)
- **UI:** Tailwind CSS + shadcn/ui
- **Paiements:** PayPal SDK
- **Emails:** Nodemailer (SMTP)
- **Déploiement:** Docker + Coolify

## 📝 Licence

Ce projet est sous licence privée. Tous droits réservés.

## 👥 Auteurs

Développé par l'équipe QRPass

---

**Besoin d'aide ?** Ouvrez une issue sur GitHub ou contactez-nous à contact@qrpass.com
