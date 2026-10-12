// Every sentence the app says out loud, in one place.
//
// Labels -- a button, a heading, a field's name -- stay in the JSX, where
// reading them is what makes the JSX legible. What lives here is the *prose*:
// placeholders, empty states, the line under a field, the warning on a delete.
// Those are the words that set the app's voice, and hunting twenty files to
// change the voice is how the voice stops getting changed.
//
// Anything with a name or a count in it is a function, not a string, and its
// pluralisation lives in the function rather than at each call site.
//
// `errors` is deliberately plain: when something breaks, say what broke and get
// out of the way. Each is a fallback -- a real Error's own message wins.

/** The tail on every delete warning. Said the same way every time on purpose. */
const noTakeBacks = 'This can’t be undone.'

export const copy = {
  /** The projects list and its form -- the front door. */
  projects: {
    empty: 'No projects yet. Start one.',
    namePlaceholder: 'Something worth tracking',
    newDescription: 'Give it a name to get started.',
    editDescription: 'Give it a better name.',
    deleteWarning: (name: string) => `“${name}” will be deleted. ${noTakeBacks}`,
  },

  /** The way in, and the way to a page that isn't there. */
  login: {
    description: 'Sign in to pick up where you left off.',
    emailPlaceholder: 'you@example.com',
    sentTo: (email: string) =>
      `We sent a sign-in link to ${email}. Open it on this device to finish signing in.`,
  },

  notFound: 'That route doesn’t exist.',

  errors: {
    loadProjects: 'Could not load your projects.',
    loadProject: 'Could not load this project.',
    saveProject: 'Could not save the project.',
    deleteProject: 'Could not delete the project.',
    signedOut: 'You must be signed in to do that.',
    sendLink: 'Could not send the link.',
    reachGoogle: 'Could not reach Google.',
    notAnImage: 'That file doesn’t look like an image.',
    readImage: 'Could not read the image on this device.',
    processImage: 'Could not process that image.',
    uploadImage: 'Could not upload that photo.',
    signedOutUpload: 'You need to be signed in to upload a photo.',
  },
}
