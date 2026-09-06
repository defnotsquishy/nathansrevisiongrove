export const pageInfo = {
  Account: {
    path: 'account/',
    title: 'Your revision account',
    description:
      'Manage sign-in, cloud progress, backups and your account privacy.',
  },
  Admin: {
    path: 'admin/',
    title: 'Revision Grove administration',
    description:
      'Authorised account directory and administrator access controls.',
  },
  Privacy: {
    path: 'privacy/',
    title: 'Privacy policy',
    description:
      'What Revision Grove stores, why it is used and how to control or delete your data.',
  },
  Cookies: {
    path: 'cookies/',
    title: 'Cookies and browser storage',
    description:
      'How Revision Grove uses essential browser storage without advertising or analytics trackers.',
  },
  Credits: {
    path: 'credits/',
    title: 'Copyright and credits',
    description:
      'Website copyright, First Class Maths attribution and open-source credits.',
  },
  Today: {
    path: '',
    title: 'Revision dashboard',
    description:
      'Plan your next GCSE revision session, track your effort and grow your revision tree.',
  },
  Timetable: {
    path: 'timetable/',
    title: 'Revision timetable',
    description:
      'Create a flexible GCSE revision timetable with your available days, topic sessions and regular breaks.',
  },
  'Topic map': {
    path: 'topics/',
    title: 'GCSE maths topic map',
    description:
      'Explore 106 GCSE Higher Maths topics, confidence check-ins and First Class Maths video links.',
  },
  'My grove': {
    path: 'grove/',
    title: 'Your progress grove',
    description:
      'See your completed revision sessions grow an interactive 3D tree and review your study journal.',
  },
  'Maths lab': {
    path: 'maths-lab/',
    title: 'Interactive maths lab',
    description:
      'Explore quadratic graphs and rotate 3D cylinders, cones and spheres to understand their dimensions.',
  },
  Resources: {
    path: 'resources/',
    title: 'Maths revision resources',
    description:
      'Find First Class Maths topic questions, worked solutions, GCSE past papers and practice papers.',
  },
  Sources: {
    path: 'sources/',
    title: 'Sources and study research',
    description:
      'Read the five research questions behind Revision Grove and the credited sources for its maths resources.',
  },
} as const;
export type View = keyof typeof pageInfo;
export function pageHref(view: View, base = '/') {
  return base + pageInfo[view].path;
}
