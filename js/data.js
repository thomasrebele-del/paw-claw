export const STAGE_ORDER = ["baby", "juvenile", "adolescent", "adult", "prime", "alpha"];

export const STAGE_LABEL = {
  baby: "Baby",
  juvenile: "Juvenile",
  adolescent: "Adolescent",
  adult: "Adult",
  prime: "Prime",
  alpha: "Alpha",
};

export const FOODS = [
  { id: "meat", name: "Meat", hint: "Dogs, wolves, and big cats" },
  { id: "fish", name: "Fish", hint: "Cats, foxes, and fishing birds" },
  { id: "greens", name: "Greens", hint: "Rabbits, horses, deer, and goats" },
  { id: "seeds", name: "Seeds", hint: "Birds" },
  { id: "fruit", name: "Fruit", hint: "Bears, elephants, camels, and apes" },
];

export const ACCESSORIES = {
  "tiny-bell": "Tiny Bell",
  "flight-ribbon": "Flight Ribbon",
  "hunter-band": "Hunter Band",
  "forest-leaf": "Forest Leaf",
  "gale-crest": "Gale Crest",
  "cliff-bell": "Cliff Bell",
  "desert-sash": "Desert Sash",
  "guardian-fang": "Guardian Fang",
};

const bond = (id, name, stage, blurb) => ({ id, name, stage, kind: "bond", blurb });

function ride(partial) {
  return {
    minStage: "adult",
    minLevel: 1,
    speed: 12,
    accel: 18,
    stamina: 110,
    jump: 6,
    jumpLevel: 1,
    turn: 1.9,
    fly: false,
    flyStage: "adult",
    climbRate: 8,
    terrain: "Open ground",
    special: "Steady travel",
    ...partial,
  };
}

function animal(partial) {
  return {
    plan: "quad",
    stages: ["baby", "juvenile", "adolescent", "adult"],
    diet: ["meat"],
    ears: "point",
    tail: "thin",
    fluff: 1,
    spots: false,
    stripes: 0,
    mane: false,
    crest: false,
    antler: false,
    horns: 0,
    hump: 0,
    trunk: false,
    tusks: false,
    neck: 0.75,
    length: 1,
    bulk: 0.8,
    scale: 1,
    voice: 420,
    voiceType: "triangle",
    personality: "calm",
    temperament: "flee",
    base: { hp: 64, atk: 12, def: 8, speed: 6 },
    sizeM: 0.7,
    ride: null,
    climb: null,
    abilities: [
      bond("nuzzle", "Nuzzle", "baby", "A friendly nudge. Small, and still useful."),
      bond("trust", "Trust", "adolescent", "A deeper bond once they have grown into themselves."),
    ],
    blurb: "A companion of Greenwood.",
    ...partial,
  };
}

export const SPECIES = {
  shiba: animal({
    id: "shiba",
    name: "Shiba Inu",
    defaultName: "Shiba",
    scale: 0.72,
    length: 0.95,
    bulk: 0.72,
    diet: ["meat"],
    ears: "point",
    tail: "curl",
    fluff: 1.2,
    personality: "playful",
    voice: 560,
    colors: { body: "#c47a3a", belly: "#f3e2c4", accent: "#f2f4f2", dark: "#6b3d22", eye: "#3d2a1c" },
    base: { hp: 58, atk: 8, def: 7, speed: 6.2 },
    sizeM: 0.42,
    blurb: "A small curled-tail dog who would rather play than stay still.",
    abilities: [
      bond("tug", "Tug", "baby", "Pulls a toy and keeps your heels light."),
      bond("bark", "Bright Bark", "juvenile", "A happy bark that lifts the mood of nearby pets."),
    ],
  }),
  retriever: animal({
    id: "retriever",
    name: "Golden Retriever",
    defaultName: "Goldie",
    scale: 0.95,
    length: 1.15,
    bulk: 0.86,
    diet: ["meat"],
    ears: "floppy",
    tail: "feather",
    fluff: 1.1,
    personality: "playful",
    voice: 380,
    colors: { body: "#e0b15a", belly: "#f7e7c4", accent: "#f3d48a", dark: "#8a6230", eye: "#4a3422" },
    base: { hp: 78, atk: 9, def: 10, speed: 6.4 },
    sizeM: 0.58,
    blurb: "Soft ears, softer manners, and a nose for whatever you just dropped.",
    abilities: [
      bond("fetch", "Fetch", "baby", "Bounces after anything that moves."),
      bond("steady", "Steady Heart", "adult", "A calm adult who steadies the whole party."),
    ],
  }),
  wolf: animal({
    id: "wolf",
    name: "Grey Wolf",
    defaultName: "Grey Wolf",
    scale: 1.12,
    length: 1.28,
    bulk: 0.78,
    diet: ["meat"],
    ears: "point",
    tail: "bush",
    fluff: 1.35,
    personality: "clingy",
    voice: 240,
    voiceType: "sawtooth",
    colors: { body: "#8e949c", belly: "#e4ddd2", accent: "#d8d2c8", dark: "#2e3338", eye: "#e2a122" },
    base: { hp: 84, atk: 20, def: 12, speed: 7.6 },
    sizeM: 0.82,
    ride: ride({
      speed: 13.4,
      accel: 24,
      stamina: 120,
      jump: 7.2,
      turn: 2.45,
      terrain: "Forest",
      special: "Agile sprint between the trees",
    }),
    blurb: "A pup who stays at your knee, and a hunter who can carry you later.",
    abilities: [
      { id: "nip", name: "Nip", stage: "baby", kind: "strike", power: 1, blurb: "A small bite. It worries thorns and still counts in a fight." },
      { id: "howl", name: "Howl", stage: "juvenile", kind: "howl", blurb: "A short burst of speed for both of you." },
      { id: "pounce", name: "Pounce", stage: "adolescent", kind: "strike", power: 2, blurb: "A leaping strike as the legs catch up with the courage." },
      { id: "guard", name: "Guard Strike", stage: "adult", kind: "strike", power: 3, blurb: "Cuts forest briars clean. This is the Forest Guardian blow." },
    ],
  }),
  fox: animal({
    id: "fox",
    name: "Red Fox",
    defaultName: "Red Fox",
    scale: 0.78,
    length: 1.05,
    bulk: 0.58,
    diet: ["meat", "fish"],
    ears: "point",
    tail: "brush",
    fluff: 1.1,
    personality: "hunter",
    voice: 640,
    colors: { body: "#d4652f", belly: "#f4efe6", accent: "#f2f2f0", dark: "#3a2418", eye: "#f0c14a" },
    base: { hp: 52, atk: 11, def: 6, speed: 7.1 },
    sizeM: 0.4,
    blurb: "Quick, bright, and already scheming before the ears finish growing.",
    abilities: [
      bond("dash", "Kit Dash", "baby", "A short burst toward whatever just moved."),
      bond("sly", "Sly Step", "adolescent", "Light feet. The fox slips through brush."),
    ],
  }),
  cat: animal({
    id: "cat",
    name: "Wildcat",
    defaultName: "Wildcat",
    scale: 0.62,
    length: 0.95,
    bulk: 0.55,
    diet: ["fish"],
    ears: "point",
    tail: "thin",
    personality: "hunter",
    voice: 700,
    colors: { body: "#c4a36a", belly: "#f6efe2", accent: "#efe6d6", dark: "#5c4630", eye: "#7fbf4a" },
    stripes: 3,
    base: { hp: 48, atk: 12, def: 5, speed: 6.8 },
    sizeM: 0.32,
    blurb: "A kitten who practices on butterflies and means every swat.",
    abilities: [
      { id: "swat", name: "Swat", stage: "baby", kind: "feline", blurb: "Bats at moths, paws, and your bootlaces." },
      { id: "stalk", name: "Stalk", stage: "juvenile", kind: "feline", blurb: "Low and quiet. The hunt is a game with rules." },
      { id: "pounce", name: "Pounce", stage: "adolescent", kind: "feline", blurb: "The jump finally matches the ambition." },
      { id: "leap", name: "Hunter Leap", stage: "adult", kind: "feline", blurb: "A full hunting leap." },
    ],
  }),
  lion: animal({
    id: "lion",
    name: "Lion",
    defaultName: "Lion",
    scale: 1.25,
    length: 1.3,
    bulk: 1,
    diet: ["meat"],
    ears: "round",
    tail: "tuft",
    spots: true,
    mane: true,
    personality: "proud",
    voice: 180,
    voiceType: "sawtooth",
    colors: { body: "#d2a15a", belly: "#f0ddb8", accent: "#a86b32", dark: "#6a4424", eye: "#e6c15a" },
    base: { hp: 96, atk: 22, def: 14, speed: 7.2 },
    sizeM: 1.05,
    ride: ride({
      speed: 12.6,
      accel: 16,
      stamina: 115,
      jump: 6.5,
      turn: 1.7,
      terrain: "Dry grass",
      special: "A heavy, confident charge",
    }),
    blurb: "A spotted cub now. The mane comes later, and so does the ride.",
    abilities: [
      { id: "swat", name: "Cub Swat", stage: "baby", kind: "feline", blurb: "Oversized paws, serious intent." },
      { id: "pounce", name: "Practice Pounce", stage: "juvenile", kind: "feline", blurb: "The cub learns the shape of a hunt." },
      { id: "roar", name: "Roar", stage: "adolescent", kind: "howl", blurb: "The voice drops. Everyone nearby picks up the pace." },
      { id: "leap", name: "King's Leap", stage: "adult", kind: "feline", blurb: "A full-grown hunting leap." },
    ],
  }),
  tiger: animal({
    id: "tiger",
    name: "Tiger",
    defaultName: "Tiger",
    scale: 1.2,
    length: 1.4,
    bulk: 0.9,
    diet: ["meat"],
    ears: "round",
    tail: "long",
    stripes: 7,
    personality: "hunter",
    voice: 200,
    voiceType: "sawtooth",
    colors: { body: "#e0873a", belly: "#f4efe4", accent: "#f2d2a8", dark: "#2a211c", eye: "#f0c84a" },
    base: { hp: 90, atk: 24, def: 12, speed: 8 },
    sizeM: 0.98,
    ride: ride({
      speed: 14,
      accel: 26,
      stamina: 108,
      jump: 12.5,
      jumpLevel: 2,
      turn: 2.35,
      terrain: "Broken ground",
      special: "A sprinting pounce that clears the rift",
    }),
    blurb: "Stripes stay soft while they are small. The jump comes in with the shoulders.",
    abilities: [
      { id: "swat", name: "Soft Paw", stage: "baby", kind: "feline", blurb: "A cub's swat. Useful, and nowhere near full strength." },
      { id: "stalk", name: "Stalk", stage: "juvenile", kind: "feline", blurb: "Learns to set the paws down without a sound." },
      { id: "pounce", name: "Pounce", stage: "adolescent", kind: "feline", blurb: "Distance starts to make sense." },
      { id: "leap", name: "Canyon Leap", stage: "adult", kind: "feline", blurb: "Mounted, a sprinting jump can cross the rift." },
    ],
  }),
  bear: animal({
    id: "bear",
    name: "Brown Bear",
    defaultName: "Brown Bear",
    scale: 1.35,
    length: 1.2,
    bulk: 1.15,
    diet: ["fruit"],
    ears: "round",
    tail: "stub",
    fluff: 1.4,
    personality: "sleepy",
    voice: 160,
    voiceType: "square",
    colors: { body: "#8d5a34", belly: "#e6c8a4", accent: "#c48a58", dark: "#3e2918", eye: "#2c241c" },
    base: { hp: 120, atk: 18, def: 20, speed: 5.4 },
    sizeM: 1.15,
    ride: ride({
      speed: 9,
      accel: 9,
      stamina: 130,
      jump: 4.5,
      turn: 1.25,
      terrain: "Rough trails",
      special: "Shoves fallen logs off the path",
    }),
    blurb: "A round cub who sits down whenever the world is not immediately interesting.",
    abilities: [
      bond("sit", "Sit", "baby", "Plops down. Recovers a little breath for both of you."),
      bond("sniff", "Sniff", "juvenile", "Finds the interesting smells, including fruit."),
      { id: "shove", name: "Shoulder", stage: "adolescent", kind: "shove", blurb: "Tests their weight against things that do not want to move." },
      { id: "trail", name: "Trailbreak", stage: "adult", kind: "shove", blurb: "A mounted bear can shove logs aside." },
    ],
  }),
  rabbit: animal({
    id: "rabbit",
    name: "Rabbit",
    defaultName: "Rabbit",
    scale: 0.48,
    length: 0.7,
    bulk: 0.55,
    diet: ["greens"],
    ears: "long",
    tail: "puff",
    fluff: 1.3,
    personality: "hoppy",
    voice: 880,
    voiceType: "sine",
    colors: { body: "#d7c4a4", belly: "#f7f3ea", accent: "#f2ebe0", dark: "#8a7560", eye: "#5a3a28" },
    base: { hp: 36, atk: 5, def: 4, speed: 7.4 },
    sizeM: 0.26,
    blurb: "Mostly ears. The hop is the whole personality.",
    abilities: [
      bond("hop", "Happy Hop", "baby", "Bounces a circle around your boots."),
      bond("dash", "Meadow Dash", "juvenile", "A quick line through the grass."),
    ],
  }),
  deer: animal({
    id: "deer",
    name: "Giant Deer",
    defaultName: "Giant Deer",
    scale: 1.45,
    length: 1.35,
    bulk: 0.8,
    neck: 1.35,
    diet: ["greens"],
    ears: "point",
    tail: "short",
    spots: true,
    antler: true,
    personality: "calm",
    voice: 360,
    colors: { body: "#a87848", belly: "#f0e2cc", accent: "#e7d3b0", dark: "#5c4030", eye: "#3a2a1c" },
    base: { hp: 88, atk: 10, def: 11, speed: 7.8 },
    sizeM: 1.35,
    ride: ride({
      speed: 13.2,
      accel: 20,
      stamina: 125,
      jump: 8,
      turn: 1.8,
      terrain: "Meadows",
      special: "A long, quiet stride",
    }),
    blurb: "A fawn with spots and no antlers yet. The rack arrives with adulthood.",
  }),
  horse: animal({
    id: "horse",
    name: "Horse",
    defaultName: "Horse",
    scale: 1.55,
    length: 1.4,
    bulk: 0.82,
    neck: 1.7,
    diet: ["greens"],
    ears: "point",
    tail: "long",
    crest: true,
    personality: "calm",
    voice: 220,
    voiceType: "square",
    colors: { body: "#8c4b2b", belly: "#e7c8a4", accent: "#2a211c", dark: "#241812", eye: "#2c241c" },
    base: { hp: 92, atk: 9, def: 12, speed: 8.2 },
    sizeM: 1.55,
    ride: ride({
      speed: 15.2,
      accel: 28,
      stamina: 150,
      jump: 8.5,
      turn: 2.05,
      terrain: "Open fields",
      special: "The fastest honest gallop in the meadows",
    }),
    blurb: "Long legs are a grown horse's whole trick. A foal is still mostly eyes.",
    abilities: [
      bond("nuzzle", "Nuzzle", "baby", "A foal's nose in your palm."),
      { id: "canter", name: "Canter", stage: "juvenile", kind: "howl", blurb: "Not rideable yet. Matching their pace makes you a little quicker." },
      bond("gallop", "Gallop", "adult", "The stride opens. This is when the saddle makes sense."),
    ],
  }),
  zebra: animal({
    id: "zebra",
    name: "Zebra",
    defaultName: "Zebra",
    scale: 1.4,
    length: 1.3,
    bulk: 0.8,
    neck: 1.4,
    diet: ["greens"],
    ears: "point",
    tail: "tuft",
    stripes: 8,
    crest: true,
    personality: "proud",
    voice: 280,
    voiceType: "square",
    colors: { body: "#f4f1ea", belly: "#f7f5f0", accent: "#f7f7f4", dark: "#1c1c1c", eye: "#3a3228" },
    base: { hp: 86, atk: 10, def: 11, speed: 8 },
    sizeM: 1.32,
    ride: ride({
      speed: 14.2,
      accel: 24,
      stamina: 128,
      jump: 7.5,
      turn: 2,
      terrain: "Open fields",
      special: "A sharp, flashing stride",
    }),
    blurb: "The stripes are faint on a foal and loud on an adult.",
  }),
  camel: animal({
    id: "camel",
    name: "Camel",
    defaultName: "Camel",
    scale: 1.7,
    length: 1.45,
    bulk: 0.9,
    neck: 1.8,
    diet: ["fruit", "greens"],
    ears: "small",
    tail: "thin",
    hump: 1,
    personality: "calm",
    voice: 190,
    voiceType: "square",
    colors: { body: "#d2b07a", belly: "#f0e2c4", accent: "#e6d2a4", dark: "#7a5a32", eye: "#5a4630" },
    base: { hp: 110, atk: 11, def: 16, speed: 6.2 },
    sizeM: 1.85,
    ride: ride({
      speed: 11.2,
      accel: 12,
      stamina: 190,
      jump: 4,
      turn: 1.35,
      terrain: "Deep sand",
      special: "Crosses the Crystal Desert without slowing",
    }),
    blurb: "The hump is a nub at first. Adulthood is when the dunes stop arguing.",
    abilities: [
      bond("nuzzle", "Nuzzle", "baby", "A sandy nose. They are already patient."),
      bond("pace", "Practice Pace", "juvenile", "Learns the slow step that eats distance."),
      bond("dune", "Dune Walker", "adult", "Sand is no longer a tax. Riding unlocks the deep desert."),
    ],
  }),
  elephant: animal({
    id: "elephant",
    name: "Elephant",
    defaultName: "Elephant",
    plan: "elephant",
    stages: ["baby", "juvenile", "adolescent", "adult", "prime"],
    scale: 1.8,
    length: 1.5,
    bulk: 1.3,
    diet: ["fruit"],
    ears: "fan",
    tail: "tuft",
    trunk: true,
    tusks: true,
    personality: "calm",
    voice: 110,
    voiceType: "square",
    colors: { body: "#b7b4ae", belly: "#d9d4cc", accent: "#cfc8be", dark: "#6e6a64", eye: "#3a342c" },
    base: { hp: 160, atk: 16, def: 26, speed: 4.6 },
    sizeM: 2.5,
    ride: ride({
      speed: 7.4,
      accel: 6,
      stamina: 140,
      jump: 2.2,
      turn: 1.05,
      terrain: "Heavy ground",
      special: "Pushes boulders other mounts cannot budge",
    }),
    blurb: "A calf with a stub of a trunk. Prime is a different size of silence.",
    abilities: [
      bond("toot", "Tiny Toot", "baby", "The trunk is short and the sound is not."),
      bond("follow", "Follow Foot", "juvenile", "They walk in your tracks on purpose."),
      { id: "press", name: "Press", stage: "adolescent", kind: "shove", blurb: "Learns that some rocks are a suggestion." },
      { id: "trumpet", name: "Trumpet", stage: "adult", kind: "shove", blurb: "A mounted adult can roll boulders aside." },
      bond("prime", "Prime Bulk", "prime", "Another stage of size. The ground notices."),
    ],
  }),
  gorilla: animal({
    id: "gorilla",
    name: "Gorilla",
    defaultName: "Gorilla",
    plan: "ape",
    scale: 1.25,
    length: 0.9,
    bulk: 1.15,
    diet: ["fruit"],
    ears: "small",
    tail: "none",
    personality: "calm",
    voice: 140,
    voiceType: "square",
    colors: { body: "#3c4650", belly: "#6a625c", accent: "#2a3036", dark: "#1a1e22", eye: "#c4a05a" },
    base: { hp: 130, atk: 20, def: 18, speed: 5.2 },
    sizeM: 1.4,
    ride: ride({
      speed: 8.6,
      accel: 11,
      stamina: 118,
      jump: 5,
      turn: 1.4,
      terrain: "Foothills",
      special: "A knuckle-running climb onto broad rocks",
    }),
    blurb: "An infant with a huge face. The arms arrive later and so does the ride.",
    abilities: [
      bond("cling", "Cling", "baby", "Stays close enough to hold a finger."),
      bond("beat", "Chest Beat", "adolescent", "A practice drum. Startling, and fond."),
      bond("carry", "Carry", "adult", "Strong enough to take a rider on the shoulder."),
    ],
  }),
  goat: animal({
    id: "goat",
    name: "Mountain Goat",
    defaultName: "Mountain Goat",
    scale: 0.95,
    length: 1,
    bulk: 0.7,
    diet: ["greens"],
    ears: "side",
    tail: "short",
    horns: 1,
    personality: "proud",
    voice: 480,
    colors: { body: "#e7e2d8", belly: "#f7f4ee", accent: "#d9d3c8", dark: "#6a645c", eye: "#c4a15a" },
    base: { hp: 70, atk: 9, def: 12, speed: 6.6 },
    sizeM: 0.72,
    climb: "adolescent",
    ride: ride({
      speed: 11.4,
      accel: 20,
      stamina: 124,
      jump: 9,
      turn: 2.1,
      terrain: "Cliff paths",
      special: "Climbing unlocks at adolescent, riding at adult",
    }),
    blurb: "A kid with button horns. Adolescent hooves are what the high trail respects.",
    abilities: [
      bond("skip", "Skip", "baby", "Bounces on rocks that are not rocks yet."),
      { id: "sure", name: "Surefoot", stage: "adolescent", kind: "climb", blurb: "The high trail holds. Walk north together." },
      bond("ridge", "Ridge Rider", "adult", "Old enough to carry you on the same cliffs."),
    ],
  }),
  eagle: animal({
    id: "eagle",
    name: "Eagle",
    defaultName: "Eagle",
    plan: "bird",
    stages: ["baby", "juvenile", "adolescent", "adult", "prime"],
    scale: 1.65,
    length: 0.85,
    bulk: 0.7,
    diet: ["seeds", "fish"],
    ears: "none",
    tail: "fan",
    personality: "flutter",
    voice: 740,
    voiceType: "square",
    colors: { body: "#8a5a32", belly: "#f0e6d4", accent: "#f4f1ea", dark: "#3a2a22", eye: "#e6c14a" },
    base: { hp: 64, atk: 16, def: 8, speed: 7 },
    sizeM: 0.7,
    ride: ride({
      speed: 16,
      accel: 22,
      stamina: 130,
      jump: 0,
      turn: 1.7,
      fly: true,
      climbRate: 9,
      terrain: "Open sky",
      special: "True flight once they are grown. The Sky Perch is up there.",
    }),
    blurb: "A downy chick with wings that are mostly a promise.",
    abilities: [
      { id: "flutter", name: "Flutter", stage: "baby", kind: "flutter", seconds: 0.9, cap: 1.15, blurb: "A hop and a frantic flap. Not a flight." },
      { id: "wingbeat", name: "Wingbeat", stage: "juvenile", kind: "flutter", seconds: 2.2, cap: 2.5, blurb: "A short glide, low to the grass." },
      { id: "glide", name: "Glide", stage: "adolescent", kind: "glide", seconds: 4.6, cap: 5, blurb: "Longer, still well below the perch." },
      { id: "soar", name: "Soar", stage: "adult", kind: "soar", blurb: "Mount them. Space climbs, C descends." },
      { id: "gale", name: "Gale", stage: "prime", kind: "soar", blurb: "A prime eagle climbs as if the air owes them a favor." },
    ],
  }),
  owl: animal({
    id: "owl",
    name: "Giant Owl",
    defaultName: "Giant Owl",
    plan: "bird",
    scale: 1.75,
    length: 0.62,
    bulk: 0.9,
    diet: ["meat", "seeds"],
    ears: "tuft",
    tail: "fan",
    personality: "flutter",
    voice: 320,
    voiceType: "sine",
    colors: { body: "#6e6254", belly: "#e7dcc8", accent: "#d9cbb6", dark: "#3a342c", eye: "#f0b429" },
    base: { hp: 72, atk: 14, def: 10, speed: 6.2 },
    sizeM: 0.85,
    ride: ride({
      speed: 13,
      accel: 16,
      stamina: 136,
      jump: 0,
      turn: 1.55,
      fly: true,
      climbRate: 7,
      terrain: "Night air",
      special: "A quieter, heavier flight than the eagle",
    }),
    blurb: "A round owlet. The silent wings are an adult invention.",
    abilities: [
      { id: "flutter", name: "Flap", stage: "baby", kind: "flutter", seconds: 0.8, cap: 1, blurb: "More round than airborne." },
      { id: "wingbeat", name: "Silent Beat", stage: "juvenile", kind: "flutter", seconds: 2, cap: 2.2, blurb: "A low glide with almost no sound." },
      { id: "glide", name: "Moon Glide", stage: "adolescent", kind: "glide", seconds: 4, cap: 4.5, blurb: "Farther, still a practice flight." },
      { id: "soar", name: "Night Soar", stage: "adult", kind: "soar", blurb: "A mounted owl flies. The perch still belongs to the eagle story." },
    ],
  }),
  aurora: animal({
    id: "aurora",
    name: "Aurora Bird",
    defaultName: "Aurora",
    plan: "bird",
    stages: ["baby", "juvenile", "adolescent", "adult", "prime"],
    scale: 1.85,
    length: 0.95,
    bulk: 0.75,
    diet: ["fruit", "seeds"],
    ears: "none",
    tail: "fan",
    personality: "flutter",
    voice: 620,
    voiceType: "sine",
    colors: { body: "#4aa3b5", belly: "#f7f1cf", accent: "#f2c14e", dark: "#1e4e5c", eye: "#f7f4ea" },
    base: { hp: 80, atk: 15, def: 11, speed: 7.4 },
    sizeM: 1.05,
    ride: ride({
      speed: 17.5,
      accel: 24,
      stamina: 142,
      jump: 0,
      turn: 1.85,
      fly: true,
      climbRate: 11,
      terrain: "High wind",
      special: "A mythical climb. Some sky shelves want this wing.",
    }),
    blurb: "A handful of down and gold. Prime is a weather event with feathers.",
    abilities: [
      { id: "flutter", name: "Spark Flutter", stage: "baby", kind: "flutter", seconds: 1, cap: 1.3, blurb: "Glitters more than it flies." },
      { id: "wingbeat", name: "Warm Gust", stage: "juvenile", kind: "flutter", seconds: 2.4, cap: 2.8, blurb: "A short, bright glide." },
      { id: "glide", name: "Ribbon Glide", stage: "adolescent", kind: "glide", seconds: 5, cap: 5.5, blurb: "Pretty, and still not the perch." },
      { id: "soar", name: "Aurora Soar", stage: "adult", kind: "soar", blurb: "Mount them and the sky opens." },
      bond("prime", "Prime Wind", "prime", "One more stage. The climb gets rude in the best way."),
    ],
  }),
};

const FIGHTERS = new Set(["wolf", "cat", "lion", "tiger", "bear", "gorilla", "eagle", "owl", "aurora", "elephant"]);

for (const key of Object.keys(SPECIES)) {
  const sp = SPECIES[key];
  sp.id = key;
  sp.temperament = FIGHTERS.has(key) ? "fight" : "flee";
  if (!sp.stages.includes("alpha")) sp.stages = [...sp.stages, "alpha"];
  if (!sp.abilities.some((a) => a.stage === "alpha")) {
    sp.abilities.push(bond("alpha-mark", "Alpha Mark", "alpha", "A larger frame, a new coat, and a presence other animals back away from."));
  }
}

export const BOSSES = [
  { id: "boss-thorn", species: "wolf", name: "Thorn, the Briar Alpha", x: -28, z: -42, hp: 1600, scale: 1.8 },
  { id: "boss-maw", species: "bear", name: "Maw of Greyhorn", x: 6, z: -90, hp: 2000, scale: 2 },
  { id: "boss-tyrant", species: "eagle", name: "Sky Tyrant", x: 18, z: 72, hp: 1400, scale: 1.8 },
];

export const SPAWNS = [
  { id: "fox", species: "fox", x: 14, z: -2 },
  { id: "wolf", species: "wolf", x: -18, z: -10 },
  { id: "deer", species: "deer", x: -62, z: 6 },
  { id: "rabbit", species: "rabbit", x: -48, z: 18 },
  { id: "bear", species: "bear", x: 10, z: -30 },
  { id: "cat", species: "cat", x: -8, z: 28 },
  { id: "horse", species: "horse", x: -74, z: -14 },
  { id: "zebra", species: "zebra", x: -86, z: 12 },
  { id: "lion", species: "lion", x: 76, z: -6 },
  { id: "tiger", species: "tiger", x: 28, z: -22 },
  { id: "elephant", species: "elephant", x: 52, z: -34 },
  { id: "camel", species: "camel", x: 90, z: 6 },
  { id: "gorilla", species: "gorilla", x: 14, z: -58 },
  { id: "goat", species: "goat", x: -10, z: -74 },
  { id: "eagle", species: "eagle", x: 24, z: -64 },
  { id: "owl", species: "owl", x: -26, z: -16 },
  { id: "retriever", species: "retriever", x: -58, z: 26 },
  { id: "aurora", species: "aurora", x: 22, z: 74 },
];

export function stageIndex(stage) {
  const i = STAGE_ORDER.indexOf(stage);
  return i < 0 ? 0 : i;
}

export function stageAtLeast(stage, min) {
  return stageIndex(stage) >= stageIndex(min);
}

export function stageLabel(stage) {
  return STAGE_LABEL[stage] || stage;
}

export function nextStage(species, stage) {
  const list = species.stages;
  const i = list.indexOf(stage);
  if (i < 0 || i >= list.length - 1) return null;
  return list[i + 1];
}

export function foodName(id) {
  return FOODS.find((f) => f.id === id)?.name || id;
}

export function xpNeed(level) {
  return 24 + level * 18;
}

export function petStats(pet) {
  const sp = SPECIES[pet.species];
  const last = stageIndex(sp.stages[sp.stages.length - 1]);
  const t = stageIndex(pet.stage) / Math.max(1, last);
  const growth = 0.94 + (pet.growth / 100) * 0.08;
  const lv = 1 + (pet.level - 1) * 0.06;
  const stageMul = 0.62 + t * 0.52;
  return {
    hp: Math.round(sp.base.hp * stageMul * lv * 10),
    atk: Math.round(sp.base.atk * stageMul * lv),
    def: Math.round(sp.base.def * stageMul * lv),
    speed: sp.base.speed * (0.68 + t * 0.38) * (1 + (pet.level - 1) * 0.03),
    sizeM: sp.sizeM * (0.42 + t * 0.62) * growth,
  };
}

export function sizeText(pet) {
  const sp = SPECIES[pet.species];
  const m = petStats(pet).sizeM;
  const where = sp.plan === "bird" ? "tall" : sp.plan === "ape" ? "at the shoulder" : "at the shoulder";
  return `${m.toFixed(2)} m ${where}`;
}

export function unlockedAbilities(pet) {
  const sp = SPECIES[pet.species];
  return sp.abilities.filter((a) => stageAtLeast(pet.stage, a.stage));
}

export function lockedAbilities(pet) {
  const sp = SPECIES[pet.species];
  return sp.abilities.filter((a) => !stageAtLeast(pet.stage, a.stage));
}

export function currentAbility(pet) {
  const list = unlockedAbilities(pet);
  return list[list.length - 1] || null;
}

export function canClimb(pet) {
  if (!pet) return false;
  const sp = SPECIES[pet.species];
  return !!(sp.climb && stageAtLeast(pet.stage, sp.climb));
}

export function mountProfile(pet) {
  if (!pet) {
    return { rideable: false, unlocked: false, reason: "No companion is following." };
  }
  const sp = SPECIES[pet.species];
  if (!sp.ride) {
    return { rideable: false, unlocked: false, reason: `${sp.name} is not a mount.` };
  }
  const stageOk = stageAtLeast(pet.stage, sp.ride.minStage);
  const levelOk = pet.level >= sp.ride.minLevel;
  const last = stageIndex(sp.stages[sp.stages.length - 1]);
  const t = stageIndex(pet.stage) / Math.max(1, last);
  const lv = 1 + Math.max(0, pet.level - 1) * 0.045;
  const jumpReady = pet.level >= (sp.ride.jumpLevel || 1);
  let reason = "Ready to ride.";
  if (!stageOk) reason = `Riding unlocks at ${stageLabel(sp.ride.minStage)}.`;
  else if (!levelOk) reason = `Needs level ${sp.ride.minLevel}.`;
  return {
    rideable: true,
    unlocked: stageOk && levelOk,
    reason,
    speed: sp.ride.speed * (0.86 + t * 0.18) * lv,
    accel: sp.ride.accel,
    stamina: Math.round(sp.ride.stamina * (1 + Math.max(0, pet.level - 1) * 0.06)),
    jump: (sp.ride.jump || 0) * (jumpReady ? 1 : 0.55),
    jumpReady,
    turn: sp.ride.turn * (1 + Math.max(0, pet.level - 4) * 0.05),
    fly: !!sp.ride.fly && stageAtLeast(pet.stage, sp.ride.flyStage || "adult"),
    climbRate: sp.ride.climbRate * (pet.stage === "prime" ? 1.18 : 1) * (pet.level >= 3 ? 1.12 : 1),
    terrain: sp.ride.terrain,
    special: sp.ride.special,
    minStage: sp.ride.minStage,
    minLevel: sp.ride.minLevel,
  };
}

export function passivePerSecond(isActive) {
  return isActive ? 100 / 140 : 100 / 340;
}

export function timeUntilNext(pet, isActive) {
  const sp = SPECIES[pet.species];
  if (!nextStage(sp, pet.stage)) return null;
  const remain = Math.max(0, 100 - pet.growth);
  return remain / passivePerSecond(isActive);
}

export function growthNeeds(pet) {
  const sp = SPECIES[pet.species];
  if (!nextStage(sp, pet.stage)) return ["Fully grown."];
  const foods = sp.diet.map(foodName).join(" or ");
  return [
    "Time in your collection",
    `A favorite meal: ${foods}`,
    "Distance walked while they follow",
    "Growth missions",
  ];
}

export function formatDuration(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function findPet(s, species) {
  return s.pets.find((p) => p.species === species) || null;
}

export const MISSIONS = [
  {
    id: "friendship",
    title: "An unexpected friendship",
    summary: "Befriend a wild animal.",
    reward: { coins: 25, xp: 14 },
    progress: (s) => `${Math.min(1, s.stats.befriended)} / 1 creatures befriended`,
    ratio: (s) => Math.min(1, s.stats.befriended / 1),
    done: (s) => s.stats.befriended >= 1,
  },
  {
    id: "first-steps",
    title: "First Steps",
    summary: "Walk with any baby companion until they have seen a stretch of the world.",
    reward: { xp: 22, growth: 18, item: "tiny-bell" },
    progress: (s) => `${Math.min(70, s.stats.babyDistance).toFixed(0)} / 70 m with a baby`,
    ratio: (s) => Math.min(1, s.stats.babyDistance / 70),
    done: (s) => s.stats.babyDistance >= 70,
  },
  {
    id: "learning-to-fly",
    title: "Learning to Fly",
    summary: "Help a young bird practice. Flutter, wingbeat, or glide three times.",
    reward: { xp: 26, growth: 22, item: "flight-ribbon" },
    progress: (s) => `${Math.min(3, s.stats.birdFlutters)} / 3 flight practices`,
    ratio: (s) => Math.min(1, s.stats.birdFlutters / 3),
    done: (s) => s.stats.birdFlutters >= 3,
  },
  {
    id: "little-hunter",
    title: "Little Hunter",
    summary: "Let a cat, lion, or tiger use a hunting ability three times.",
    reward: { xp: 24, growth: 20, item: "hunter-band" },
    progress: (s) => `${Math.min(3, s.stats.felineHunts)} / 3 feline abilities`,
    ratio: (s) => Math.min(1, s.stats.felineHunts / 3),
    done: (s) => s.stats.felineHunts >= 3,
  },
  {
    id: "forest-adventure",
    title: "Forest Adventure",
    summary: "Take a baby wolf on their first long walk through Greenwood.",
    reward: { xp: 24, growth: 22, item: "forest-leaf" },
    progress: (s) => {
      const w = findPet(s, "wolf");
      if (!w) return "Recruit a baby wolf";
      return `${Math.min(80, s.stats.wolfDistance).toFixed(0)} / 80 m in the forest as a pup`;
    },
    ratio: (s) => Math.min(1, s.stats.wolfDistance / 80),
    done: (s) => s.stats.wolfDistance >= 80,
  },
  {
    id: "first-flight",
    title: "First Flight",
    summary: "Raise a baby eagle to adulthood, mount them, and land on the Sky Perch.",
    reward: { xp: 48, growth: 12, coins: 40, item: "gale-crest" },
    progress: (s) => {
      const e = findPet(s, "eagle");
      if (!e) return "Recruit a baby eagle";
      if (!stageAtLeast(e.stage, "adult")) return `Raise your eagle · ${stageLabel(e.stage)} ${Math.floor(e.growth)}%`;
      if (!s.stats.reachedPerch) return "Mount the adult eagle and land on the Sky Perch";
      return "Complete";
    },
    ratio: (s) => {
      const e = findPet(s, "eagle");
      if (!e) return 0;
      const stagePart = stageIndex(e.stage) / stageIndex("adult");
      return Math.min(1, stagePart * 0.6 + (s.stats.reachedPerch ? 0.4 : e.growth / 100 * 0.15));
    },
    done: (s) => s.stats.reachedPerch,
  },
  {
    id: "mountain",
    title: "The Mountain Crossing",
    summary: "Raise a mountain goat until it can climb, train it to level 2, and reach the High Ledge together.",
    reward: { xp: 40, growth: 16, item: "cliff-bell" },
    progress: (s) => {
      const g = findPet(s, "goat");
      if (!g) return "Recruit a baby mountain goat";
      if (!stageAtLeast(g.stage, "adolescent")) return `Grow your goat · ${stageLabel(g.stage)} ${Math.floor(g.growth)}%`;
      if (g.level < 2) return `Train your goat to level 2 · now level ${g.level}`;
      if (!s.stats.reachedPeak) return "Climb together to the High Ledge";
      return "Complete";
    },
    ratio: (s) => {
      const g = findPet(s, "goat");
      if (!g) return 0;
      let n = 0;
      if (stageAtLeast(g.stage, "adolescent")) n += 0.45;
      else n += (stageIndex(g.stage) / stageIndex("adolescent")) * 0.45;
      if (g.level >= 2) n += 0.2;
      if (s.stats.reachedPeak) n += 0.35;
      return Math.min(1, n);
    },
    done: (s) => s.stats.reachedPeak,
  },
  {
    id: "desert",
    title: "Desert Expedition",
    summary: "Raise a camel to adulthood and ride it to the Crystal Oasis.",
    reward: { xp: 40, growth: 16, item: "desert-sash" },
    progress: (s) => {
      const c = findPet(s, "camel");
      if (!c) return "Recruit a baby camel";
      if (!stageAtLeast(c.stage, "adult")) return `Raise your camel · ${stageLabel(c.stage)} ${Math.floor(c.growth)}%`;
      if (!s.stats.reachedOasis) return "Ride the adult camel to the Crystal Oasis";
      return "Complete";
    },
    ratio: (s) => {
      const c = findPet(s, "camel");
      if (!c) return 0;
      const stagePart = stageIndex(c.stage) / stageIndex("adult");
      return Math.min(1, stagePart * 0.65 + (s.stats.reachedOasis ? 0.35 : 0));
    },
    done: (s) => s.stats.reachedOasis,
  },
  {
    id: "guardian",
    title: "The Forest Guardian",
    summary: "Raise a wolf through every stage, cut two briars with Guard Strike, and ride them through the trees.",
    reward: { xp: 48, growth: 14, item: "guardian-fang" },
    progress: (s) => {
      const w = findPet(s, "wolf");
      if (!w) return "Recruit a baby wolf";
      if (!stageAtLeast(w.stage, "adult")) return `Raise your wolf · ${stageLabel(w.stage)} ${Math.floor(w.growth)}%`;
      if (s.stats.briarsCut < 2) return `Guard Strike briars ${s.stats.briarsCut} / 2`;
      if (s.stats.wolfRidden < 40) return `Ride your wolf ${s.stats.wolfRidden.toFixed(0)} / 40 m`;
      return "Complete";
    },
    ratio: (s) => {
      const w = findPet(s, "wolf");
      if (!w) return 0;
      let n = (stageIndex(w.stage) / stageIndex("adult")) * 0.4;
      n += Math.min(0.3, (s.stats.briarsCut / 2) * 0.3);
      n += Math.min(0.3, (s.stats.wolfRidden / 40) * 0.3);
      return Math.min(1, n);
    },
    done: (s) => {
      const w = findPet(s, "wolf");
      return !!(w && stageAtLeast(w.stage, "adult") && s.stats.briarsCut >= 2 && s.stats.wolfRidden >= 40);
    },
  },
];

export function defaultSave() {
  return {
    v: 1,
    lastSeen: Date.now(),
    welcomed: false,
    muted: false,
    coins: 48,
    day: 1,
    minutes: 8 * 60 + 40,
    foods: { meat: 2, fish: 1, greens: 2, seeds: 1, fruit: 2 },
    ownedAccessories: [],
    removedWild: [],
    cutBriars: [],
    movedObstacles: [],
    forageGone: {},
    activeUid: "maple",
    pets: [
      {
        uid: "maple",
        species: "shiba",
        name: "Maple",
        stage: "baby",
        growth: 8,
        xp: 0,
        level: 1,
        bond: 24,
        playSeconds: 0,
        accessories: [],
        lastFeedAt: 0,
      },
    ],
    stats: {
      befriended: 0,
      babyDistance: 0,
      birdFlutters: 0,
      felineHunts: 0,
      wolfDistance: 0,
      wolfRidden: 0,
      briarsCut: 0,
      reachedPerch: false,
      reachedPeak: false,
      reachedOasis: false,
      discovered: { shiba: true },
      bosses: [],
    },
    missionsDone: {},
  };
}
