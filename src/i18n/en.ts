/** Every string in the app. `tr.ts` must define the same keys; the type checks it. */
export const en = {
  'tab.home': 'Home', 'tab.runs': 'Runs', 'tab.stats': 'Stats', 'tab.feed': 'Feed', 'tab.you': 'You',
  'common.back': 'Back', 'common.cancel': 'Cancel', 'common.close': 'Close', 'common.dismiss': 'Dismiss',
  'common.settings': 'Settings', 'common.tryAgain': 'Try again', 'common.tryingAgain': 'Trying again…',
  'common.loading': 'Loading', 'common.notSet': 'Not set', 'common.logo': 'Exa Running Clan',
  'common.clubName': 'EXA RUNNING CLAN', 'common.justNow': 'Just now', 'common.yesterday': 'Yesterday',
  'common.minutesAgo': '{n}m', 'common.hoursAgo': '{n}h', 'common.save': 'Save', 'common.saved': 'Saved',

  'welcome.place': 'Girne · North Cyprus · Est. 2025',
  'welcome.headline': 'Two runs\na week.\nNobody alone.',
  'welcome.body': '350 runners, every pace welcome, and coffee after every run.',
  'welcome.create': 'Create account', 'welcome.have': 'I already have one',
  'welcome.setup': 'No Supabase project configured. Copy .env.example to .env and add your project URL and anon key, then restart with `npx expo start --clear`.',

  'auth.email': 'Email', 'auth.password': 'Password', 'auth.emailInvalid': 'Enter a valid email address',
  'auth.showPassword': 'Show password', 'auth.hidePassword': 'Hide password', 'auth.show': 'Show', 'auth.hide': 'Hide',
  'auth.offline': 'No connection. Try again when you are back online.',

  'signin.headline': 'Welcome\nback.', 'signin.sub': 'Two runs a week, and the next one is waiting.',
  'signin.passwordMissing': 'Enter your password', 'signin.forgotNeedsEmail': 'Enter your email first and we will send a reset link',
  'signin.resetSent': 'Check your inbox for a reset link.', 'signin.forgot': 'Forgot?',
  'signin.submit': 'Sign in', 'signin.busy': 'Signing in…', 'signin.newHere': 'New here?', 'signin.create': 'Create an account',
  'signin.badCredentials': 'That email and password do not match.', 'signin.unconfirmed': 'Confirm your email address first.',

  'reg.step': 'Step {n} of 3', 'reg.join': 'Join the clan', 'reg.who': 'Who are\nyou?', 'reg.fullName': 'Full name',
  'reg.namePlaceholder': 'Ayşe Demir', 'reg.nameMissing': 'Tell us your name', 'reg.passwordRule': 'At least 8 characters',
  'reg.emailUse': 'We only use your email for your account and club updates.',
  'reg.paceTitle': 'Pick your\npace group.', 'reg.paceSub': 'Minutes per kilometre. You can change it before any run.',
  'reg.paceMissing': 'Pick a group. You can change it before any run.',
  'reg.paceHelp': 'Not sure? Pick Own pace and run whatever feels comfortable. Nobody finishes alone.',
  'reg.ownPaceHint': 'Whatever feels comfortable', 'reg.minKm': 'min/km', 'reg.minKmLabel': '{pace} minutes per kilometre',
  'reg.ownPaceLabel': 'Own pace, whatever feels comfortable',
  'reg.runsTitle': 'Which runs\nare yours?', 'reg.runsSub': 'Choose the runs you usually join. You can still come to either.',
  'reg.wed': 'WED', 'reg.sun': 'SUN', 'reg.wedLabel': 'Trackday', 'reg.sunLabel': 'Long run',
  'reg.continue': 'Continue', 'reg.submit': 'Join the clan', 'reg.busy': 'Joining…',
  'reg.emailTaken': 'That email is already on the roster. Sign in instead.', 'reg.passwordRejected': 'That password was rejected. Try a longer one.',

  'done.kicker': "Member #{n} · you're in", 'done.headline': 'See you\n{day},\n{name}.', 'done.runner': 'runner',
  'done.runLine': '{title}, {time}. {place}. {pace}', 'done.ownPace': 'Run at whatever pace feels comfortable.', 'done.lookFor': 'Look out for the {pace} group.',
  'done.paceGroup': 'Pace group', 'done.going': 'Going {day}', 'done.open': 'Open the app', 'done.dayFallback': 'Wednesday',
  'done.confirmKicker': 'One last step', 'done.confirmTitle': 'Check your\nemail.',
  'done.confirmBody': 'We sent a confirmation link to {email}. Tap it, then sign in.', 'done.toSignIn': 'Go to sign in',

  'reset.title': 'Choose a new\npassword.', 'reset.field': 'New password', 'reset.submit': 'Save password', 'reset.busy': 'Saving…', 'reset.saved': 'Password changed.', 'reset.failed': "Couldn't change your password. Request a new link and try again.",

  'gate.title': "Couldn't load the clan", 'gate.body': 'Check your connection and try again.',

  'pace.own': 'Own', 'pace.ownName': 'own pace', 'pace.groupName': '{pace} group', 'pace.ownLong': 'Own pace', 'pace.groupLabel': 'Pace group {pace} minutes per kilometre', 'pace.running': '{n} running',

  'run.rsvp': 'RSVP', 'run.in': 'In', 'run.cancelled': 'Cancelled', 'run.moved': 'Changed', 'run.going': '{n} going', 'run.goingCaps': 'Going', 'run.after': 'After: {what}',
  'run.youreIn': ', you\'re in', 'run.countMeIn': 'Count me in', 'run.youreInPace': "You're in · {pace}", 'run.tapToCancel': "You're in. Tap to cancel",
  'run.isCancelled': 'This run is cancelled', 'run.changedBanner': 'This run has changed', 'run.details': '{title} details', 'run.detailsFallback': 'Run details',
  'run.meet': 'Meet', 'run.distance': 'Distance', 'run.surface': 'Surface', 'run.afterLabel': 'After', 'run.pickPace': 'Pick your pace group', 'run.chat': 'Run chat', 'run.pinned': 'Pinned',
  'run.messagePlaceholder': 'Message the group', 'run.send': 'Send', 'run.sendLabel': 'Send message', 'run.moreRunners': 'Show {n} more runners',
  'run.addCalendar': 'Add to calendar', 'run.manage': 'Manage this run', 'run.meetMap': 'Meet · tap for directions', 'run.meetMapLabel': 'Meet point: {place}. Opens in maps.', 'run.mapPlaceholder': 'map — {place}',

  'home.next': 'Next clan run · {day} {time}', 'home.startsIn': 'Starts in {d} days {h} hours {m} minutes',
  'home.days': 'Days', 'home.hrs': 'Hrs', 'home.min': 'Min', 'home.sec': 'Sec',
  'home.comingUp': 'Coming up', 'home.noRuns': 'No runs scheduled yet. Pull down to check again.', 'home.yourWeek': 'Your week', 'home.logRun': 'Log a run',
  'home.km': 'KM', 'home.runs': 'Runs', 'home.moving': 'Moving', 'home.today': ', today', 'home.ran': 'ran', 'home.noRun': 'no run',
  'home.dayLetters': 'M,T,W,T,F,S,S', 'home.dayNames': 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
  'home.challengeLine': '{n} days left. Every logged kilometre counts, solo runs included.',

  'runs.title': 'Schedule', 'runs.sub': 'Two runs a week, coffee after each one.', 'runs.weekly': 'Weekly', 'runs.races': 'Races',
  'runs.noRaces': 'No races on the calendar yet.', 'runs.signedUp': '{n} signed up', 'runs.join': 'Join', 'runs.joined': 'In', 'runs.addRace': 'Add a race', 'runs.signupPage': 'Sign-up page', 'runs.removeRace': 'Remove',

  'stats.logged': '{km} km logged · {n} week streak', 'stats.weekly': 'Weekly km', 'stats.last8': 'Last 8 weeks', 'stats.empty': 'Log your first run and your weeks start filling in.',
  'stats.board': 'Leaderboard', 'stats.rank': "You're #{n} this month", 'stats.kmMonth': 'Km this month', 'stats.boardEmpty': 'Nobody has logged a run this month yet.',
  'stats.percent': '{n}%', 'stats.ringLabel': '{n} percent of monthly target', 'stats.barsLabel': 'Kilometres per week, oldest first: {list}', 'stats.rowLabel': '{rank}. {name}, {km} kilometres',

  'feed.title': 'Feed', 'feed.write': 'Write a post', 'feed.empty': 'Nothing here yet. After your first clan run, post how it went.',
  'feed.distance': 'Distance', 'feed.pace': 'Avg pace', 'feed.kudos': 'Kudos', 'feed.kudosOn': 'Kudos ✓', 'feed.kudosCount': '{n} kudos', 'feed.comments': '{n} comments',
  'feed.giveKudos': 'Give kudos', 'feed.removeKudos': 'Remove kudos', 'feed.photo': 'photo',

  'comments.title': 'Comments', 'comments.empty': 'No comments yet. Be the first.', 'comments.placeholder': 'Add a comment', 'comments.sendLabel': 'Send comment', 'comments.failed': "Couldn't post your comment", 'comments.loadFailed': "Couldn't load comments", 'comments.post': 'Post',

  'compose.kicker': 'To the clan feed', 'compose.title': 'New post', 'compose.you': 'You', 'compose.now': 'Now', 'compose.bwNote': 'Shown in black and white, as the feed renders it',
  'compose.change': 'Change', 'compose.remove': 'Remove', 'compose.addPhoto': 'Add a photo', 'compose.photoOptional': 'Optional. A post reads fine without one.', 'compose.how': 'How did it go?',
  'compose.placeholder': 'Tough session, great coffee…', 'compose.bodyLabel': 'What you want to say', 'compose.foot': 'Kudos and comments come from the clan.', 'compose.attach': 'Attach a run',
  'compose.attachHelp': 'Labels the post with the session, so the clan knows which run it was.', 'compose.submit': 'Post to the feed', 'compose.busy': 'Posting…', 'compose.failed': "Couldn't post that",
  'compose.photoDenied': 'Exa needs access to your photos to add one', 'compose.photoBlocked': 'Allow photo access for Exa in Settings to add a picture',

  'log.kicker': 'Your week', 'log.title': 'Log a run', 'log.today': 'Today', 'log.yesterday': 'Yesterday', 'log.distance': 'Distance · km', 'log.time': 'Moving time · minutes', 'log.pace': 'Average pace',
  'log.distanceError': 'Enter a distance in kilometres, like 8.5', 'log.timeError': 'Enter your moving time in minutes, like 45', 'log.submit': 'Log this run', 'log.busy': 'Logging…', 'log.done': 'Logged {km} km', 'log.failed': "Couldn't log that run. Your numbers are still here.",

  'you.since': 'Member #{n} · since {date}', 'you.paceGroup': 'Pace group', 'you.clanRuns': 'Clan runs', 'you.kmYear': 'KM {year}', 'you.minKm': 'Min per km', 'you.paceHelp': 'Switch any time, or pick Own and run whatever feels comfortable. Nobody finishes alone.',
  'you.emergency': 'Emergency contact', 'you.added': 'Added', 'you.kit': 'Clan kit', 'you.notifications': 'Notifications', 'you.runDayChat': 'Run day + comments', 'you.runDay': 'Run day', 'you.chat': 'Comments', 'you.off': 'Off', 'you.appearance': 'Appearance', 'you.language': 'Language',

  'settings.member': 'Member #{n}', 'settings.title': 'Settings', 'settings.appearance': 'Appearance', 'settings.dark': 'Dark', 'settings.light': 'Light', 'settings.system': 'System', 'settings.appearanceHelp': 'System follows your phone. The clan red stays the same.',
  'settings.language': 'Language', 'settings.langSystem': 'Phone', 'settings.langHelp': 'Phone follows your phone’s language. Run details appear as the leaders wrote them.',
  'settings.notifications': 'Notifications', 'settings.runDay': 'Run day', 'settings.runDayHelp': 'A reminder 12 hours before runs you joined, and alerts if they change', 'settings.comments': 'Comments', 'settings.commentsHelp': 'When someone comments on your post',
  'settings.notifDenied': 'Allow notifications for Exa in your phone’s Settings',
  'settings.target': 'Monthly target · km', 'settings.targetLabel': '{km} kilometres a month', 'settings.targetHelp': '{km} km so far this month. The ring on Stats is your share of this target.', 'settings.targetHelpEmpty': 'The ring on Stats is your share of this target.',
  'settings.kit': 'Clan kit · vest size', 'settings.emergency': 'Emergency contact', 'settings.contactName': 'Name', 'settings.contactPhone': 'Phone', 'settings.contactHelp': 'Run leaders can see this for runs you join, in case something happens.', 'settings.saveContact': 'Save contact',
  'settings.account': 'Account', 'settings.memberNumber': 'Member number', 'settings.email': 'Email', 'settings.signOut': 'Sign out', 'settings.signOutConfirm': 'Sign out of Exa Running Clan?',

  'manage.kicker': 'Leader tools', 'manage.date': 'This date', 'manage.onTrack': 'On', 'manage.statusChanged': 'Changed', 'manage.statusCancelled': 'Cancelled', 'manage.notice': 'Notice for runners', 'manage.noticePlaceholder': 'Storm forecast, so we start at the café instead.',
  'manage.meetDate': 'Meeting point, this date only', 'manage.meetDateHelp': 'Leave empty to use the usual meeting point.', 'manage.saveDate': 'Save and tell runners', 'manage.busy': 'Saving…', 'manage.savedDate': 'Run updated', 'manage.failed': "Couldn't save. Check your connection and try again.",
  'manage.weekly': 'Every week', 'manage.weeklyHelp': 'Changing the time moves every upcoming date. People who already joined stay on the list.', 'manage.name': 'Run name', 'manage.time': 'Start time · 24-hour', 'manage.timeError': 'Use 24-hour time, like 19:00', 'manage.place': 'Meeting point', 'manage.placeError': 'Enter a meeting point', 'manage.nameError': 'Enter a name',
  'manage.location': 'Map location', 'manage.locationHelp': 'Paste coordinates (35.33, 33.31) or a full Google Maps link. Leave empty for no map.', 'manage.locationError': "That doesn't contain coordinates. Long-press the spot in Google Maps and copy the numbers.", 'manage.after': 'After the run', 'manage.description': 'Description', 'manage.saveWeekly': 'Save weekly details', 'manage.savedWeekly': 'Weekly details saved',
  'manage.contacts': 'Emergency contacts', 'manage.contactsHelp': 'Everyone going on this date. Keep these private.', 'manage.noContact': 'No contact added', 'manage.nobody': 'Nobody has joined yet.', 'manage.callLabel': 'Call {name}', 'manage.notAllowed': 'Only leaders can manage runs.', 'manage.contactsFailed': "Couldn't load contacts",

  'race.kicker': 'Leader tools', 'race.title': 'Add a race', 'race.name': 'Race name', 'race.date': 'Date · YYYY-MM-DD', 'race.location': 'Location', 'race.note': 'Note', 'race.link': 'Sign-up link', 'race.nameError': 'Enter the race name', 'race.dateError': 'Use a date like 2027-03-15', 'race.submit': 'Add race', 'race.busy': 'Adding…', 'race.failed': "Couldn't add the race",

  'toast.rsvpFailed': "Couldn't save your RSVP. Check your connection.", 'toast.paceFailed': "Couldn't change your pace group", 'toast.settingFailed': "Couldn't save that setting", 'toast.kudosFailed': "Couldn't send kudos", 'toast.messageFailed': "Couldn't send your message", 'toast.refreshFailed': "Couldn't refresh. Showing the last update.", 'toast.raceFailed': "Couldn't update your race entry",

  'notif.title': '{title} is coming up', 'notif.body': '{day} {time}. {place}',
};
