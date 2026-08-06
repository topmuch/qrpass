/**
 * Hajj Journey Stages — All major steps of the Hajj pilgrimage
 * Used for "Rassurer la famille" notifications and journey tracking
 */

export type HajjStageKey =
  | 'tawaf-qudum'
  | 'saee-safa-marwa'
  | 'mina-day1'
  | 'arafat'
  | 'muzdalifah'
  | 'lapidation-sacrifice'
  | 'tawaf-ifadah'
  | 'mina-day2'
  | 'oumrah-ifrad'
  | 'tawaf-wida'
  | 'medina'
  | 'mecca-general';

export interface HajjStage {
  key: HajjStageKey;
  order: number;
  /** Short emoji icon */
  icon: string;
  /** French label */
  labelFr: string;
  /** English label */
  labelEn: string;
  /** Arabic label */
  labelAr: string;
  /** French description */
  descFr: string;
  /** English description */
  descEn: string;
  /** Arabic description */
  descAr: string;
  /** WhatsApp message sent to family — French */
  msgFr: string;
  /** WhatsApp message sent to family — English */
  msgEn: string;
  /** WhatsApp message sent to family — Arabic */
  msgAr: string;
  /** Next stage key for "prochaine étape" hint */
  nextKey?: HajjStageKey;
  /** Holy site category for GPS matching */
  holySite?: 'medina' | 'mecca' | 'mina' | 'arafat' | 'muzdalifah';
}

export const HAJJ_STAGES: HajjStage[] = [
  {
    key: 'medina',
    order: 0,
    icon: '🕌',
    labelFr: 'Médine — Avant le Hajj',
    labelEn: 'Medina — Before Hajj',
    labelAr: 'المدينة المنورة — قبل الحج',
    descFr: 'Séjour à Médine, repos et préparation avant le Hajj',
    descEn: 'Stay in Medina, rest and preparation before Hajj',
    descAr: 'الإقامة في المدينة المنورة، الراحة والاستعداد قبل الحج',
    msgFr: 'Bonjour la famille, je suis à Médine, tout se passe bien, je me repose avant le Hajj, à très bientôt inch\'Allah',
    msgEn: 'Hello family, I am in Medina, everything is going well, I am resting before Hajj, see you soon insha\'Allah',
    msgAr: 'مرحبا بالعائلة، أنا في المدينة المنورة، كل شيء على ما يرام، أستريح قبل الحج، أراكم قريباً إن شاء الله',
    nextKey: 'tawaf-qudum',
    holySite: 'medina',
  },
  {
    key: 'tawaf-qudum',
    order: 1,
    icon: '🕋',
    labelFr: 'Tawaf al-Qudum (Circumambulation d\'arrivée)',
    labelEn: 'Tawaf al-Qudum (Arrival Circumambulation)',
    labelAr: 'طواف القدوم (الطواف عند الوصول)',
    descFr: 'Formuler l\'intention et accomplir sept tours autour de la Kaaba. Prier deux rakats derrière Maqam Ibrahim. Boire de l\'eau de Zamzam.',
    descEn: 'Make intention and perform seven circuits around the Kaaba. Pray two rakats behind Maqam Ibrahim. Drink Zamzam water.',
    descAr: 'نية الطواف وأداء سبعة أشواط حول الكعبة. صلاة ركعتين خلف مقام إبراهيم. شرب ماء زمزم.',
    msgFr: 'Bonjour la famille, je viens d\'arriver à la Mecque et j\'ai fait le Tawaf d\'arrivée autour de la Kaaba, la prochaine étape c\'est le Sa\'ee entre Safa et Marwa, tout se passe bien alhamdulillah',
    msgEn: 'Hello family, I just arrived in Mecca and performed the arrival Tawaf around the Kaaba, the next step is Sa\'ee between Safa and Marwa, everything is going well alhamdulillah',
    msgAr: 'مرحبا بالعائلة، لقد وصلت إلى مكة وأديت طواف القدوم حول الكعبة، المرحلة التالية هي السعي بين الصفا والمروة، كل شيء على ما يرام والحمد لله',
    nextKey: 'saee-safa-marwa',
    holySite: 'mecca',
  },
  {
    key: 'saee-safa-marwa',
    order: 2,
    icon: '🚶',
    labelFr: 'Sa\'ee entre Safa et Marwa',
    labelEn: 'Sa\'ee between Safa and Marwa',
    labelAr: 'السعي بين الصفا والمروة',
    descFr: 'Formuler l\'intention et accomplir sept trajets entre Safa et Marwa. Se désacraliser si Tamattu, sinon rester en Ihram.',
    descEn: 'Make intention and perform seven trips between Safa and Marwa. Exit Ihram if performing Tamattu, otherwise remain in Ihram.',
    descAr: 'نية السعي وأداء سبعة أشواط بين الصفا والمروة. التحلل إذا كنت متمتعاً، وإلا البقاء في الإحرام.',
    msgFr: 'Bonjour la famille, j\'ai terminé le Sa\'ee entre Safa et Marwa, la prochaine étape c\'est le départ vers Mina, tout se passe bien alhamdulillah',
    msgEn: 'Hello family, I completed the Sa\'ee between Safa and Marwa, the next step is heading to Mina, everything is going well alhamdulillah',
    msgAr: 'مرحبا بالعائلة، أنهيت السعي بين الصفا والمروة، المرحلة التالية هي التوجه إلى منى، كل شيء على ما يرام والحمد لله',
    nextKey: 'mina-day1',
    holySite: 'mecca',
  },
  {
    key: 'mina-day1',
    order: 3,
    icon: '⛺',
    labelFr: 'Premier séjour à Mina (8ᵉ jour)',
    labelEn: 'First stay at Mina (8th day)',
    labelAr: 'المبيت الأول في منى (اليوم الثامن)',
    descFr: 'Se rendre à Mina, y accomplir les prières et passer la nuit. Partir le lendemain matin vers Arafat.',
    descEn: 'Go to Mina, perform prayers there and spend the night. Leave the next morning towards Arafat.',
    descAr: 'التوجه إلى منى، أداء الصلوات والمبيت فيها. الانطلاق صباح اليوم التالي نحو عرفات.',
    msgFr: 'Bonjour la famille, je suis arrivé à Mina pour le premier jour du Hajj, demain nous partons vers Arafat pour le jour le plus important, tout se passe bien alhamdulillah',
    msgEn: 'Hello family, I arrived at Mina for the first day of Hajj, tomorrow we head to Arafat for the most important day, everything is going well alhamdulillah',
    msgAr: 'مرحبا بالعائلة، وصلت إلى منى في أول يوم الحج، غداً نتوجه إلى عرفات في أهم يوم، كل شيء على ما يرام والحمد لله',
    nextKey: 'arafat',
    holySite: 'mina',
  },
  {
    key: 'arafat',
    order: 4,
    icon: '🏔️',
    labelFr: 'Station d\'Arafat (9ᵉ jour)',
    labelEn: 'Standing at Arafat (9th day)',
    labelAr: 'الوقوف بعرفات (اليوم التاسع)',
    descFr: 'Formuler l\'intention et prier à Arafat. Passer la journée en invocations et méditation. Quitter après le coucher du soleil pour Mouzdalifa.',
    descEn: 'Make intention and pray at Arafat. Spend the day in supplications and meditation. Leave after sunset for Muzdalifah.',
    descAr: 'نية الوقوف والصلاة بعرفات. قضاء اليوم في الدعاء والتأمل. الانصراف بعد غروب الشمس إلى مزدلفة.',
    msgFr: 'Bonjour la famille, je suis à Arafat pour le jour le plus important du Hajj, c\'est le jour du pardon et de la miséricorde, la prochaine étape c\'est Muzdalifah, priez pour moi alhamdulillah',
    msgEn: 'Hello family, I am at Arafat for the most important day of Hajj, the day of forgiveness and mercy, the next step is Muzdalifah, please pray for me alhamdulillah',
    msgAr: 'مرحبا بالعائلة، أنا في عرفات في أهم يوم من الحج، يوم المغفرة والرحمة، المرحلة التالية هي مزدلفة، ادعوا لي والحمد لله',
    nextKey: 'muzdalifah',
    holySite: 'arafat',
  },
  {
    key: 'muzdalifah',
    order: 5,
    icon: '🌙',
    labelFr: 'Halte à Mouzdalifa',
    labelEn: 'Stop at Muzdalifah',
    labelAr: 'المبيت في مزدلفة',
    descFr: 'Prier le soir et ramasser les cailloux destinés à la lapidation. Passer la nuit sur place.',
    descEn: 'Pray in the evening and collect pebbles for the stoning. Spend the night there.',
    descAr: 'صلاة المغرب والعشاء وجمع الحصى لرمي الجمرات. المبيت في مزدلفة.',
    msgFr: 'Bonjour la famille, je suis à Muzdalifah, j\'ai ramassé les cailloux pour la lapidation, demain retour à Mina pour le lancer de pierres et le sacrifice, tout se passe bien alhamdulillah',
    msgEn: 'Hello family, I am at Muzdalifah, I collected the pebbles for the stoning, tomorrow back to Mina for the stoning and sacrifice, everything is going well alhamdulillah',
    msgAr: 'مرحبا بالعائلة، أنا في مزدلفة، جمعت الحصى لرمي الجمرات، غداً العودة إلى منى للرمي والذبح، كل شيء على ما يرام والحمد لله',
    nextKey: 'lapidation-sacrifice',
    holySite: 'muzdalifah',
  },
  {
    key: 'lapidation-sacrifice',
    order: 6,
    icon: '🪨',
    labelFr: 'Lapidation et Sacrifice (10ᵉ jour)',
    labelEn: 'Stoning and Sacrifice (10th day)',
    labelAr: 'رمي الجمرات والذبح (اليوم العاشر)',
    descFr: 'Lapider la grande stèle (Jamrat al-Kubra) avec sept cailloux. Se désacraliser. Effectuer le sacrifice pour Tamattu ou Qiran.',
    descEn: 'Stone the large pillar (Jamrat al-Kubra) with seven pebbles. Exit Ihram. Perform the sacrifice for Tamattu or Qiran.',
    descAr: 'رمي جمرة العقبة الكبرى بسبع حصيات. التحلل. ذبح الهدي للمتمتع والقارن.',
    msgFr: 'Bonjour la famille, j\'ai effectué la lapidation et le sacrifice, je suis maintenant désacralisé, la prochaine étape c\'est le Tawaf al-Ifadah, tout se passe bien alhamdulillah',
    msgEn: 'Hello family, I performed the stoning and sacrifice, I have now exited Ihram, the next step is Tawaf al-Ifadah, everything is going well alhamdulillah',
    msgAr: 'مرحبا بالعائلة، أديت الرمي والذبح، تحللت من الإحرام، المرحلة التالية هي طواف الإفاضة، كل شيء على ما يرام والحمد لله',
    nextKey: 'tawaf-ifadah',
    holySite: 'mina',
  },
  {
    key: 'tawaf-ifadah',
    order: 7,
    icon: '🕋',
    labelFr: 'Tawaf al-Ifadah',
    labelEn: 'Tawaf al-Ifadah',
    labelAr: 'طواف الإفاضة',
    descFr: 'Faire sept tours de la Kaaba. Prier deux rakats et boire du Zamzam. Effectuer le Sa\'ee si Tamattu.',
    descEn: 'Perform seven circuits of the Kaaba. Pray two rakats and drink Zamzam. Perform Sa\'ee if Tamattu.',
    descAr: 'أداء سبعة أشواط حول الكعبة. صلاة ركعتين وشرب ماء زمزم. السعي إذا كنت متمتعاً.',
    msgFr: 'Bonjour la famille, j\'ai fait le Tawaf al-Ifadah autour de la Kaaba, le Hajj est presque terminé, je retourne à Mina pour les derniers jours, tout se passe bien alhamdulillah',
    msgEn: 'Hello family, I performed Tawaf al-Ifadah around the Kaaba, Hajj is almost complete, I return to Mina for the final days, everything is going well alhamdulillah',
    msgAr: 'مرحبا بالعائلة، أديت طواف الإفاضة حول الكعبة، الحج شارف على الانتهاء، أعود إلى منى للأيام الأخيرة، كل شيء على ما يرام والحمد لله',
    nextKey: 'mina-day2',
    holySite: 'mecca',
  },
  {
    key: 'mina-day2',
    order: 8,
    icon: '⛺',
    labelFr: 'Second séjour à Mina',
    labelEn: 'Second stay at Mina',
    labelAr: 'المبيت الثاني في منى',
    descFr: 'Passer deux ou trois nuits à Mina. Lapidider chaque jour les trois stèles (Jamrat) avec sept cailloux chacune. Fin du pèlerinage.',
    descEn: 'Spend two or three nights at Mina. Stone the three pillars each day with seven pebbles each. End of pilgrimage.',
    descAr: 'المبيت في منى ليلتين أو ثلاث. رمي الجمرات الثلاث كل يوم بسبع حصيات لكل واحدة. نهاية الحج.',
    msgFr: 'Bonjour la famille, je suis de retour à Mina pour les jours de Tashreeq, je lapide les stèles chaque jour, le Hajj est bientôt fini, tout se passe bien alhamdulillah',
    msgEn: 'Hello family, I am back at Mina for the days of Tashreeq, stoning the pillars each day, Hajj is almost over, everything is going well alhamdulillah',
    msgAr: 'مرحبا بالعائلة، عدت إلى منى لأيام التشريق، أرمي الجمرات كل يوم، الحج شارف على الانتهاء، كل شيء على ما يرام والحمد لله',
    nextKey: 'tawaf-wida',
    holySite: 'mina',
  },
  {
    key: 'oumrah-ifrad',
    order: 9,
    icon: '✨',
    labelFr: 'Oumrah (pour les pèlerins Ifrad)',
    labelEn: 'Umrah (for Ifrad pilgrims)',
    labelAr: 'العمرة (للمفرد)',
    descFr: 'Se remettre en état d\'Ihram. Accomplir le Tawaf, le Sa\'ee et la désacralisation.',
    descEn: 'Re-enter Ihram. Perform Tawaf, Sa\'ee and exit Ihram.',
    descAr: 'الإحرام مجدداً. أداء الطواف والسعي والتحلل.',
    msgFr: 'Bonjour la famille, je fais l\'Oumrah, Tawaf et Sa\'ee accomplis, tout se passe bien alhamdulillah',
    msgEn: 'Hello family, I am performing Umrah, Tawaf and Sa\'ee completed, everything is going well alhamdulillah',
    msgAr: 'مرحبا بالعائلة، أؤدي العمرة، الطواف والسعي منجزان، كل شيء على ما يرام والحمد لله',
    nextKey: 'tawaf-wida',
    holySite: 'mecca',
  },
  {
    key: 'tawaf-wida',
    order: 10,
    icon: '🕊️',
    labelFr: 'Tawaf al-Wida (Circumambulation d\'adieu)',
    labelEn: 'Tawaf al-Wida (Farewell Circumambulation)',
    labelAr: 'طواف الوداع',
    descFr: 'Accomplir sept tours de la Kaaba. Prier deux rakats. Quitter la Mecque en rendant grâce à Allah.',
    descEn: 'Perform seven circuits of the Kaaba. Pray two rakats. Leave Mecca praising Allah.',
    descAr: 'أداء سبعة أشواط حول الكعبة. صلاة ركعتين. مغادرة مكة حامدين الله.',
    msgFr: 'Bonjour la famille, j\'ai fait le Tawaf d\'adieu, le Hajj est terminé alhamdulillah, je quitterai la Mecque bientôt, à très bientôt inch\'Allah',
    msgEn: 'Hello family, I performed the farewell Tawaf, Hajj is complete alhamdulillah, I will leave Mecca soon, see you soon insha\'Allah',
    msgAr: 'مرحبا بالعائلة، أديت طواف الوداع، الحج منجز والحمد لله، سأغادر مكة قريباً، أراكم قريباً إن شاء الله',
    holySite: 'mecca',
  },
  {
    key: 'mecca-general',
    order: 11,
    icon: '🕌',
    labelFr: 'Séjour à la Mecque',
    labelEn: 'Stay in Mecca',
    labelAr: 'الإقامة في مكة المكرمة',
    descFr: 'Séjour général à la Mecque entre les étapes',
    descEn: 'General stay in Mecca between stages',
    descAr: 'الإقامة العامة في مكة المكرمة بين المراحل',
    msgFr: 'Bonjour la famille, je suis à la Mecque, tout se passe bien alhamdulillah, à très bientôt inch\'Allah',
    msgEn: 'Hello family, I am in Mecca, everything is going well alhamdulillah, see you soon insha\'Allah',
    msgAr: 'مرحبا بالعائلة، أنا في مكة المكرمة، كل شيء على ما يرام والحمد لله، أراكم قريباً إن شاء الله',
    holySite: 'mecca',
  },
];

/** Get a stage by key */
export function getHajjStage(key: HajjStageKey): HajjStage | undefined {
  return HAJJ_STAGES.find((s) => s.key === key);
}

/** Get label in the current language */
export function getStageLabel(stage: HajjStage, lang: 'fr' | 'en' | 'ar'): string {
  if (lang === 'ar') return stage.labelAr;
  if (lang === 'en') return stage.labelEn;
  return stage.labelFr;
}

/** Get description in the current language */
export function getStageDesc(stage: HajjStage, lang: 'fr' | 'en' | 'ar'): string {
  if (lang === 'ar') return stage.descAr;
  if (lang === 'en') return stage.descEn;
  return stage.descFr;
}

/** Get WhatsApp message in the current language */
export function getStageMessage(stage: HajjStage, lang: 'fr' | 'en' | 'ar'): string {
  if (lang === 'ar') return stage.msgAr;
  if (lang === 'en') return stage.msgEn;
  return stage.msgFr;
}

/** Map GPS-detected holy site to the most relevant stage key */
export function holySiteToStageKey(
  site: 'medina' | 'mecca' | 'mina' | 'arafat' | 'muzdalifah' | null
): HajjStageKey | null {
  if (!site) return null;
  const map: Record<string, HajjStageKey> = {
    medina: 'medina',
    mina: 'mina-day1',
    arafat: 'arafat',
    muzdalifah: 'muzdalifah',
    mecca: 'mecca-general',
  };
  return map[site] ?? null;
}
