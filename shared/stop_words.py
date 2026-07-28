"""
==========================================================
Desarrollado por: 

📌https://github.com/AlanSebastianArce
📌https://www.linkedin.com/in/alansebastianarce

==========================================================

Stop Words completas para inglés y español.
Usado por los notebooks de Colab y por la API de FastAPI.

Lista ampliada de Stop Words:

~750 palabras ✅ EN
~950 palabras ☑️ ES

Versión optimizada para clasificación de texto
y ordenada alfabeticamente dentro de cada categoria..

Incluye:

- Artículos
- Pronombres
- Verbos comunes (auxiliares + verbos muy frecuentes + conjugaciones)
- Preposiciones
- Conjunciones
- Adverbios comunes
- Cuantificadores
- Posesivos          (solo ES)
- Relativos          (solo ES)
- Números escritos
- Ordinales
- Fracciones
- Meses
- Días
- Estaciones
- Abreviaturas comunes
- Unidades de medida
- Símbolos
- Palabras técnicas NLP
- Demostrativos / tiempo   (solo EN)
- Generales
==========================================================
"""


STOP_WORDS_EN: list[str] = [
    # ── Articulos ──
    "a", "an", "the",
    # ── Pronombres ──
    "anybody", "anyone", "anything", "everybody", "everyone",
    "everything", "he", "her", "hers", "herself", "him", "himself",
    "his", "i", "it", "its", "itself", "me", "mine", "my",
    "myself", "nobody", "nothing", "one", "ones", "oneself", "our",
    "ours", "ourselves", "she", "somebody", "someone", "something",
    "that", "thee", "their", "theirs", "them", "themselves",
    "these", "they", "thine", "this", "those", "thou", "thy", "us",
    "we", "what", "whatever", "which", "whichever", "who",
    "whoever", "whom", "whomever", "whose", "ye", "you", "your",
    "yours", "yourself", "yourselves",
    # ── Verbos comunes ──
    "add", "added", "adding", "adds", "am", "appear", "appeared",
    "appearing", "appears", "are", "ask", "asked", "asking",
    "asks", "be", "became", "become", "becomes", "becoming",
    "been", "began", "begin", "beginning", "begins", "begun",
    "being", "bring", "bringing", "brings", "brought", "call",
    "called", "calling", "calls", "came", "can", "come", "comes",
    "coming", "consider", "considered", "considering", "considers",
    "continue", "continued", "continues", "continuing", "could",
    "dare", "dared", "dares", "daring", "did", "do", "does",
    "doing", "done", "feel", "feeling", "feels", "felt", "find",
    "finding", "finds", "found", "gave", "get", "gets", "getting",
    "give", "given", "gives", "giving", "go", "goes", "going",
    "gone", "got", "gotten", "had", "has", "hast", "hath", "have",
    "having", "hear", "heard", "hearing", "hears", "help",
    "helped", "helping", "helps", "include", "included",
    "includes", "including", "is", "keep", "keeping", "keeps",
    "kept", "knew", "know", "knowing", "known", "knows", "leave",
    "leaves", "leaving", "left", "let", "lets", "letting", "look",
    "looked", "looking", "looks", "lose", "loses", "losing",
    "lost", "made", "make", "makes", "making", "may", "mean",
    "meaning", "means", "meant", "meet", "meeting", "meets", "met",
    "might", "move", "moved", "moves", "moving", "must", "need",
    "needed", "needing", "needs", "ought", "paid", "pay", "paying",
    "pays", "provide", "provided", "provides", "providing", "put",
    "puts", "putting", "ran", "remain", "remained", "remaining",
    "remains", "run", "running", "runs", "said", "saw", "say",
    "saying", "says", "see", "seeing", "seem", "seemed", "seeming",
    "seems", "seen", "sees", "set", "sets", "setting", "shall",
    "should", "show", "showed", "showing", "shown", "shows",
    "stand", "standing", "stands", "start", "started", "starting",
    "starts", "stood", "take", "taken", "takes", "taking", "tell",
    "telling", "tells", "think", "thinking", "thinks", "thought",
    "told", "took", "tried", "tries", "try", "trying", "turn",
    "turned", "turning", "turns", "use", "used", "uses", "using",
    "want", "wanted", "wanting", "wants", "was", "went", "were",
    "will", "work", "worked", "working", "works", "would",
    # ── Preposiciones ──
    "about", "above", "across", "after", "against", "along",
    "amid", "amidst", "among", "amongst", "around", "as", "at",
    "before", "behind", "below", "beneath", "beside", "besides",
    "between", "beyond", "but", "by", "concerning", "despite",
    "down", "during", "except", "excluding", "following", "for",
    "from", "in", "inside", "into", "like", "minus", "near",
    "notwithstanding", "of", "off", "on", "onto", "opposite",
    "out", "outside", "over", "past", "per", "plus", "regarding",
    "round", "save", "since", "than", "through", "throughout",
    "till", "to", "toward", "towards", "under", "underneath",
    "unlike", "until", "unto", "up", "upon", "versus", "via",
    "with", "within", "without",
    # ── Conjunciones ──
    "although", "and", "because", "both", "either", "how",
    "however", "if", "neither", "nor", "once", "or", "so",
    "though", "unless", "when", "whenever", "where", "whereas",
    "wherever", "whether", "while", "yet",
    # ── Adverbios comunes ──
    "absolutely", "actually", "again", "almost", "already", "also",
    "always", "basically", "certainly", "clearly", "completely",
    "constantly", "currently", "definitely", "directly", "easily",
    "entirely", "equally", "especially", "essentially", "even",
    "eventually", "ever", "exactly", "extremely", "fairly",
    "finally", "firstly", "fully", "generally", "gradually",
    "greatly", "hardly", "hence", "here", "highly", "immediately",
    "increasingly", "indeed", "initially", "instead", "just",
    "largely", "lately", "later", "likely", "literally", "mainly",
    "meanwhile", "merely", "mostly", "namely", "naturally",
    "nearly", "necessarily", "never", "nevertheless", "no",
    "nonetheless", "normally", "not", "now", "obviously",
    "occasionally", "often", "only", "otherwise", "particularly",
    "perhaps", "possibly", "presently", "previously", "probably",
    "promptly", "properly", "quickly", "quite", "rather",
    "readily", "really", "recently", "regularly", "relatively",
    "roughly", "seldom", "shortly", "significantly", "similarly",
    "simply", "slightly", "slowly", "somehow", "sometime",
    "sometimes", "somewhat", "somewhere", "soon", "specifically",
    "still", "strongly", "subsequently", "suddenly", "surely",
    "technically", "then", "there", "thoroughly", "too", "totally",
    "truly", "typically", "ultimately", "undoubtedly", "usually",
    "very", "virtually", "widely", "yes",
    # ── Cuantificadores ──
    "all", "another", "any", "certain", "each", "enough", "every",
    "few", "fewer", "fewest", "least", "less", "little", "many",
    "more", "most", "much", "none", "numerous", "other", "plenty",
    "several", "some", "sufficient", "various", "whole",
    # ── Numeros escritos ──
    "billion", "eight", "eighteen", "eighty", "eleven", "fifteen",
    "fifty", "five", "forty", "four", "fourteen", "hundred",
    "million", "nine", "nineteen", "ninety", "seven", "seventeen",
    "seventy", "six", "sixteen", "sixty", "ten", "thirteen",
    "thirty", "thousand", "three", "twelve", "twenty", "two",
    "zero",
    # ── Ordinales ──
    "eighth", "eleventh", "fifth", "final", "first", "former",
    "fourth", "last", "latter", "next", "ninth", "previous",
    "second", "seventh", "sixth", "tenth", "third", "twelfth",
    # ── Fracciones ──
    "double", "half", "quarter", "thrice", "triple", "twice",
    # ── Meses ──
    "apr", "april", "aug", "august", "dec", "december", "feb",
    "february", "jan", "january", "jul", "july", "jun", "june",
    "mar", "march", "nov", "november", "oct", "october", "sep",
    "sept", "september",
    # ── Dias ──
    "fri", "friday", "mon", "monday", "sat", "saturday", "sun",
    "sunday", "thu", "thur", "thurs", "thursday", "tue", "tues",
    "tuesday", "wed", "wednesday",
    # ── Estaciones ──
    "autumn", "fall", "spring", "summer", "winter",
    # ── Abreviaturas comunes ──
    "aka", "approx", "asap", "avg", "cf", "eg", "etc", "fig",
    "fyi", "ie", "max", "min", "misc", "num", "ok", "okay", "pg",
    "pp", "ref", "vol", "vs",
    # ── Unidades de medida ──
    "cm", "ft", "hr", "hrs", "kg", "km", "lb", "lbs", "mg", "mi",
    "ml", "mm", "oz", "pct", "sec", "yd",
    # ── Simbolos ──
    "amp", "percent",
    # ── Palabras tecnicas NLP ──
    "al", "cit", "et", "ibid", "op",
    # ── Demostrativos / tiempo ──
    "afterward", "afterwards", "ago", "beforehand", "early",
    "henceforth", "late", "meantime", "nowadays", "today",
    "tomorrow", "yesterday",
    # ── Generales ──
    "accordingly", "aforementioned", "aforesaid", "altogether",
    "away", "back", "case", "different", "example", "fact",
    "furthermore", "hereby", "herein", "hereof", "hereto",
    "hitherto", "howsoever", "kind", "matter", "moreover",
    "notably", "overall", "part", "point", "purpose", "reason",
    "regard", "respect", "result", "same", "sort", "such",
    "thereafter", "thereby", "therefore", "therein", "thereof",
    "thereto", "thing", "things", "thus", "type", "way", "well",
    "whatsoever", "whereby", "wherein", "whereof",
]
 
 
STOP_WORDS_ES: list[str] = [
    # ── Articulos ──
    "el", "la", "las", "lo", "los", "un", "una", "unas", "unos",
    # ── Pronombres ──
    "algo", "alguien", "aquel", "aquella", "aquellas", "aquello",
    "aquellos", "conmigo", "consigo", "contigo", "cualesquiera",
    "cualquiera", "ella", "ellas", "ello", "ellos", "esa", "esas",
    "ese", "eso", "esos", "esta", "estas", "este", "esto", "estos",
    "le", "les", "me", "nada", "nadie", "nos", "nosotras",
    "nosotros", "os", "quien", "quienes", "quienquiera", "se",
    "te", "tu", "usted", "ustedes", "vosotras", "vosotros", "yo",
    # ── Verbos comunes ──
    "busca", "buscais", "buscamos", "buscan", "buscar", "buscas",
    "busco", "cree", "creeis", "creemos", "creen", "creer",
    "crees", "crei", "creia", "creiais", "creiamos", "creian",
    "creias", "creimos", "creiste", "creisteis", "creo",
    "creyeron", "creyo", "da", "daba", "dabais", "dabamos",
    "daban", "dabas", "dais", "damos", "dan", "dar", "das", "debe",
    "debeis", "debemos", "deben", "deber", "debes", "debi",
    "debia", "debiais", "debiamos", "debian", "debias", "debieron",
    "debimos", "debio", "debiste", "debisteis", "debo", "decia",
    "deciais", "deciamos", "decian", "decias", "decimos", "decir",
    "decis", "deja", "dejais", "dejamos", "dejan", "dejar",
    "dejas", "dejo", "di", "dice", "dicen", "dices", "dieron",
    "digo", "dije", "dijeron", "dijimos", "dijiste", "dijisteis",
    "dijo", "dimos", "dio", "dira", "diran", "diras", "dire",
    "direis", "diremos", "diste", "disteis", "doy", "encontrais",
    "encontramos", "encontrar", "encuentra", "encuentran",
    "encuentras", "encuentro", "entra", "entrais", "entramos",
    "entran", "entrar", "entras", "entro", "era", "erais",
    "eramos", "eran", "eras", "eres", "es", "estaba", "estabais",
    "estabamos", "estaban", "estabas", "estais", "estamos",
    "estan", "estar", "estoy", "fue", "fueron", "fui", "fuimos",
    "fuiste", "fuisteis", "ha", "habeis", "haber", "habia",
    "habiais", "habiamos", "habian", "habias", "habra", "habran",
    "habras", "habre", "habreis", "habremos", "hace", "haceis",
    "hacemos", "hacen", "hacer", "haces", "hacia", "haciais",
    "haciamos", "hacian", "hacias", "hago", "han", "hara", "haran",
    "haras", "hare", "hareis", "haremos", "has", "he", "hemos",
    "hice", "hicieron", "hicimos", "hiciste", "hicisteis", "hizo",
    "hube", "hubieron", "hubimos", "hubiste", "hubisteis", "hubo",
    "iba", "ibais", "ibamos", "iban", "ibas", "ir", "ira", "iran",
    "iras", "ire", "ireis", "iremos", "llega", "llegais",
    "llegamos", "llegan", "llegar", "llegas", "llego", "lleva",
    "llevais", "llevamos", "llevan", "llevar", "llevas", "llevo",
    "parece", "pareceis", "parecemos", "parecen", "parecer",
    "pareces", "parezco", "pasa", "pasais", "pasamos", "pasan",
    "pasar", "pasas", "paso", "pensais", "pensamos", "pensar",
    "piensa", "piensan", "piensas", "pienso", "podeis", "podemos",
    "poder", "podia", "podiais", "podiamos", "podian", "podias",
    "podra", "podran", "podras", "podre", "podreis", "podremos",
    "pone", "poneis", "ponemos", "ponen", "poner", "pones",
    "pongo", "ponia", "poniais", "poniamos", "ponian", "ponias",
    "pude", "pudieron", "pudimos", "pudiste", "pudisteis", "pudo",
    "puede", "pueden", "puedes", "puedo", "puse", "pusieron",
    "pusimos", "pusiste", "pusisteis", "puso", "quereis",
    "queremos", "querer", "queria", "queriais", "queriamos",
    "querian", "querias", "querra", "querran", "querras", "querre",
    "querreis", "querremos", "quiere", "quieren", "quieres",
    "quiero", "quise", "quisieron", "quisimos", "quisiste",
    "quisisteis", "quiso", "sabe", "sabeis", "sabemos", "saben",
    "saber", "sabes", "sabia", "sabiais", "sabiamos", "sabian",
    "sabias", "sabra", "sabran", "sabras", "sabre", "sabreis",
    "sabremos", "sale", "salen", "sales", "salgo", "salimos",
    "salir", "salis", "seguimos", "seguir", "seguis", "sentimos",
    "sentir", "sentis", "ser", "sera", "seran", "seras", "sere",
    "sereis", "seremos", "siente", "sienten", "sientes", "siento",
    "sigo", "sigue", "siguen", "sigues", "sois", "somos", "son",
    "soy", "supe", "supieron", "supimos", "supiste", "supisteis",
    "supo", "tendra", "tendran", "tendras", "tendre", "tendreis",
    "tendremos", "teneis", "tenemos", "tener", "tengo", "tenia",
    "teniais", "teniamos", "tenian", "tenias", "tiene", "tienen",
    "tienes", "tuve", "tuvieron", "tuvimos", "tuviste",
    "tuvisteis", "tuvo", "va", "vais", "vamos", "van", "vas", "ve",
    "veia", "veiais", "veiamos", "veian", "veias", "veis", "vemos",
    "ven", "veo", "ver", "ves", "vi", "vieron", "vimos", "vio",
    "viste", "visteis", "vive", "viven", "vives", "vivimos",
    "vivir", "vivis", "vivo", "volveis", "volvemos", "volver",
    "voy", "vuelve", "vuelven", "vuelves", "vuelvo",
    # ── Preposiciones ──
    "a", "ante", "bajo", "cabe", "con", "contra", "de", "desde",
    "durante", "en", "entre", "hasta", "mediante", "para", "por",
    "segun", "sin", "sobre", "tras", "via",
    # ── Conjunciones ──
    "ademas", "asi", "aun", "aunque", "bien", "como", "conque",
    "e", "empero", "excepto", "luego", "mas", "mientras", "ni",
    "o", "ora", "pero", "porque", "pues", "que", "salvo", "si",
    "sino", "u", "y",
    # ── Adverbios comunes ──
    "abiertamente", "aca", "ahi", "ahora", "alla", "alli", "antes",
    "aparentemente", "apenas", "aproximadamente", "aqui", "ayer",
    "bastante", "brevemente", "casi", "ciertamente", "claramente",
    "completamente", "constantemente", "cuidadosamente",
    "demasiado", "despues", "directamente", "efectivamente",
    "enseguida", "entonces", "esencialmente", "especialmente",
    "eventualmente", "evidentemente", "exactamente",
    "expresamente", "finalmente", "frecuentemente", "generalmente",
    "gradualmente", "habitualmente", "hoy", "igualmente",
    "incluso", "inicialmente", "inmediatamente", "jamas",
    "justamente", "lentamente", "literalmente", "mal", "manana",
    "mayormente", "meramente", "mucho", "muy", "naturalmente",
    "necesariamente", "no", "normalmente", "nuevamente", "nunca",
    "obviamente", "ocasionalmente", "particularmente", "poco",
    "posiblemente", "precisamente", "previamente",
    "principalmente", "probablemente", "profundamente",
    "prontamente", "pronto", "propiamente", "puntualmente",
    "rapidamente", "raramente", "realmente", "recientemente",
    "regularmente", "relativamente", "repentinamente",
    "seguramente", "sencillamente", "seriamente", "siempre",
    "significativamente", "simplemente", "sinceramente",
    "siquiera", "solamente", "solo", "sumamente", "supuestamente",
    "tambien", "tampoco", "tarde", "todavia", "totalmente",
    "ultimamente", "unicamente", "usualmente", "vagamente",
    "verdaderamente", "ya",
    # ── Cuantificadores ──
    "algun", "alguna", "algunas", "algunos", "ambas", "ambos",
    "bastantes", "cada", "cualquier", "demas", "demasiada",
    "demasiadas", "demasiados", "diversa", "diversas", "diverso",
    "diversos", "harta", "hartas", "harto", "hartos", "ningun",
    "ninguna", "ningunas", "ningunos", "sendas", "sendos", "tanta",
    "tantas", "tanto", "tantos", "toda", "todas", "todo", "todos",
    "varias", "varios",
    # ── Posesivos ──
    "mi", "mia", "mias", "mio", "mios", "mis", "nuestra",
    "nuestras", "nuestro", "nuestros", "su", "sus", "suya",
    "suyas", "suyo", "suyos", "tus", "tuya", "tuyas", "tuyo",
    "tuyos", "vuestra", "vuestras", "vuestro", "vuestros",
    # ── Relativos ──
    "adonde", "cual", "cuales", "cuando", "cuanta", "cuantas",
    "cuanto", "cuantos", "cuya", "cuyas", "cuyo", "cuyos", "donde",
    # ── Numeros escritos ──
    "catorce", "cero", "cien", "ciento", "cinco", "cincuenta",
    "cuarenta", "cuatro", "diecinueve", "dieciocho", "dieciseis",
    "diecisiete", "diez", "doce", "dos", "mil", "millon",
    "millones", "noventa", "nueve", "ochenta", "ocho", "once",
    "quince", "seis", "sesenta", "setenta", "siete", "trece",
    "treinta", "tres", "uno", "veinte",
    # ── Ordinales ──
    "cuarta", "cuartas", "cuarto", "cuartos", "decima", "decimas",
    "decimo", "novena", "novenas", "noveno", "novenos", "octava",
    "octavas", "octavo", "octavos", "penultima", "penultimo",
    "primer", "primera", "primeras", "primero", "primeros",
    "quinta", "quintas", "quinto", "quintos", "segunda",
    "segundas", "segundo", "segundos", "septima", "septimas",
    "septimo", "septimos", "sexta", "sextas", "sexto", "sextos",
    "tercer", "tercera", "terceras", "tercero", "terceros",
    "ultima", "ultimas", "ultimo", "ultimos",
    # ── Fracciones ──
    "doble", "media", "medio", "mitad", "tercio", "triple",
    "veces", "vez",
    # ── Meses ──
    "abr", "abril", "ago", "agosto", "dic", "diciembre", "ene",
    "enero", "feb", "febrero", "jul", "julio", "jun", "junio",
    "mar", "marzo", "mayo", "nov", "noviembre", "oct", "octubre",
    "sep", "sept", "septiembre",
    # ── Dias ──
    "domingo", "jueves", "lunes", "martes", "miercoles", "sabado",
    "viernes",
    # ── Estaciones ──
    "invierno", "otono", "primavera", "verano",
    # ── Abreviaturas comunes ──
    "aa", "afmos", "aprox", "cia", "dr", "dra", "ej", "etc", "fig",
    "max", "min", "num", "pag", "pags", "pej", "prom", "ref", "sa",
    "sr", "sra", "srl", "srta", "ud", "uds", "vol", "vs",
    # ── Unidades de medida ──
    "cm", "gr", "grs", "hrs", "hs", "kg", "km", "lb", "lbs", "lt",
    "lts", "mg", "ml", "mm", "mts", "oz", "seg",
    # ── Simbolos ──
    "arroba", "etcetera", "porciento",
    # ── Palabras tecnicas NLP ──
    "aka", "cit", "ibid", "op",
    # ── Generales ──
    "acerca", "actual", "actuales", "area", "areas", "aspecto",
    "aspectos", "cierta", "ciertas", "cierto", "ciertos", "citado",
    "condicion", "condiciones", "consiguiente", "correspondiente",
    "correspondientes", "cosa", "cosas", "cuestion", "dicha",
    "dichas", "dicho", "dichos", "embargo", "fin", "forma",
    "general", "gran", "grande", "grandes", "grupo", "grupos",
    "lugar", "manera", "mayor", "mejor", "mencionado", "menor",
    "misma", "mismas", "mismo", "mismos", "modo", "momento",
    "momentos", "nivel", "niveles", "nueva", "nuevas", "nuevo",
    "nuevos", "numero", "otra", "otras", "otro", "otros", "parte",
    "peor", "pesar", "presente", "proceso", "procesos", "propia",
    "propias", "propio", "propios", "punto", "puntos", "razon",
    "razones", "referido", "respecto", "semejante", "semejantes",
    "situacion", "situaciones", "suma", "sumas", "sumo", "sumos",
    "susodicho", "tal", "tales", "tiempo", "tipo", "trata",
    "tratar", "traves",
]