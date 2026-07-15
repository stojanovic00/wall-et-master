# Govor za odbranu — lični primerak (nije na slajdovima)

Ovo je pun tekst izlaganja, za ličnu upotrebu. Nije deo prezentacije (`docs/`) i ne objavljuje se
na GitHub Pages-u. Kraći, sažeti podsetnici po slajdu se nalaze i u samim `<aside class="notes">`
beleškama u `docs/index.html` (vidljive samo u speaker view-u, taster **S**) — ovaj fajl je
potpuniji, "pričljiviji" tekst za vežbanje, sa naznakama vremena. Cilj: ~15 minuta.

Ciljno vreme po celini je okvirno — prilagodi tempu na probi, ali pazi na dva najduža bloka
(implementacija + bezbednosna analiza) jer tu je najlakše prekoračiti vreme.

---

## 1. Naslovna strana (~30 s)

Dobar dan, poštovana komisijo. Moje ime je Aleksandar Stojanović, i danas branim master rad na
temu "Dizajn i implementacija EIP-7702-kompatibilnog Ethereum višepotpisnog digitalnog novčanika",
urađen pod mentorstvom profesora Dušana Gajića.

U kratkim crtama — rad rešava konkretan problem: kako grupa ljudi može bezbedno i zajednički da
upravlja kripto sredstvima, a da pritom ne mora da napusti svoj standardni Ethereum nalog. Izlaganje
će trajati oko petnaest minuta, nakon čega sam na raspolaganju za pitanja.

## 2. Sadržaj (~20 s)

Prezentacija prati strukturu samog rada: prvo problem i motivaciju, zatim kratak pregled tehničkih
osnova, srce rada — EIP-7702 mehanizam, moju implementaciju kroz dva pametna ugovora, jedan bezbednosni
nalaz do kog sam došao tokom rada, demonstraciju na test mreži, stvarne izmerene rezultate, i na kraju
ograničenja i zaključak.

## 3. Problem — ograničenja EOA naloga (~1 min 30 s)

Da bismo razumeli problem, moramo prvo razumeti kako Ethereum nalog danas funkcioniše. Postoje dve
vrste naloga: takozvani EOA — nalog u vlasništvu eksternog korisnika, koji je u potpunosti kontrolisan
jednim jedinim privatnim ključem — i nalog pametnog ugovora, koji ima svoj kod.

Standardni EOA nalog, onaj koji svi mi koristimo u svakodnevnim novčanicima, ima tri ozbiljna
ograničenja koja su motivisala ovaj rad.

Prvo — jedinstvena tačka otkaza. Ako neko kompromituje taj jedan privatni ključ, ima potpun i
neograničen pristup svim sredstvima. Nema praga, nema drugog potpisa koji bi to sprečio, nema
mogućnosti opoziva.

Drugo — odsustvo višepotpisne autorizacije. U poslovnom okruženju, timu ili DAO-u, ne želite da
jedna osoba jednostrano odlučuje o trošenju zajedničkih sredstava. EOA to prosto ne podržava nativno.

Treće, i ovo je suptilnije — loše korisničko iskustvo kod ERC-20 tokena. Standard iz 2015. godine
zahteva da korisnik prvo pošalje approve transakciju, kojom dozvoljava drugom ugovoru da povuče
određenu količinu tokena, i tek onda taj ugovor može da pozove transferFrom. To znači — dve
transakcije, dva potpisivanja, dva puta se plaća gas, za ono što korisnik doživljava kao jednu radnju:
"prebaci moje tokene u zajednički novčanik".

I tu dolazimo do istraživačkog pitanja ovog rada: da li možemo da obezbedimo M-od-N višepotpisnu
autorizaciju, i atomski, jednotransakcioni depozit ERC-20 tokena — a da pritom korisnik zadrži svoj
postojeći EOA nalog, svoju adresu, svoje ključeve? [Pauza — pusti da pitanje "upije".]

## 4. Osnove (~1 min)

Pre nego što odgovorim na to pitanje, par brzih definicija radi konteksta.

EOA nalog je matematički izveden iz privatnog ključa — dvestapedeset-šestobitnog broja — koristeći
eliptičku kriptografiju. Nema kod, ne može da izvrši ništa sem da potpiše transakciju.

Pametan ugovor, s druge strane, ima kod koji je trajno zapisan na blokčejnu i izvršava se
deterministički, identično na svakom čvoru mreže.

Novčanik — poput onog koji sam razvio, WALL-ET — ne čuva sama sredstva, ona uvek ostaju u stanju
mreže. Novčanik samo čuva i koristi privatni ključ da potpisuje transakcije u ime korisnika. WALL-ET
je "vrući" novčanik u vidu veb ekstenzije, gde se ključ generiše i čuva isključivo lokalno na
korisnikovom računaru, nikad se ne šalje spolja.

I na kraju — višepotpisni protokol, M-od-N. To je model praga saglasnosti: transakcija se izvršava
tek kada M od ukupno N ovlašćenih potpisnika da svoj pristanak. [Pokazati na M-od-N slajd.] Ovo je
dobro poznat obrazac iz tradicionalnih finansija — korporativni računi rade na isti način.

## 5. EIP-7702 mehanizam (~2 min)

Sada dolazimo do centralnog mehanizma rada — EIP-7702.

EIP-7702 je uveden Pectra nadogradnjom Ethereum mreže, aktiviranom sedmog maja dvehiljadedvadesetpete
godine. Uvodi potpuno nov tip transakcije — tip 4 — koji nosi jedno novo polje: authorization_list.

Suština je jednostavna, ali moćna: vlasnik EOA naloga potpisuje ovlašćenje kojim kaže — "za moj
nalog, koristi kod ovog određenog pametnog ugovora". To ovlašćenje sadrži tri podatka: identifikator
mreže, adresu ciljnog ugovora, i nonce vrednost.

Kada mreža obradi tu transakciju, u kod slot EOA naloga — koji je inače uvek prazan — upisuje se
specijalna dvadesettrobajtna vrednost koju zovemo delegacijski označivač: heksadecimalni prefiks
0xef0100, nadovezan adresom ciljnog ugovora. Taj 0xef bajt je namerno rezervisan kao nevažeći
Ethereum bajtkod još od ranijeg predloga, tako da se ova vrednost nikad ne može pomešati sa pravim
kodom nekog ugovora.

I sada dolazimo do ključne razlike u odnosu na sva postojeća rešenja: EOA ne menja adresu. Ne gubi
svoje ključeve. On samo privremeno, na zahtev vlasnika, izvršava tuđi kod — analogno delegatecall
mehanizmu koji poznajemo iz pametnih ugovora. Ta delegacija je promenljiva — može se u svakom trenutku
opozvati novom transakcijom tipa 4 koja kao cilj postavlja nultu adresu.

[Ako komisija pita o bezbednosti mehanizma samog EIP-a — imam rezervni slajd sa nonce replay zaštitom
i chainId vezanošću, ali to ću sada preskočiti radi vremena, osim ako se ne pojavi pitanje.]

## 6. EIP-7702 kao UX unapređenje (~1 min 30 s)

Ovo je verovatno najvažniji slajd za razumevanje doprinosa rada, pa ću ga malo duže zadržati.

[Pokazati oba dijagrama.] Levo vidite klasičan tok depozita ERC-20 tokena u višepotpisni ugovor —
dve odvojene transakcije, dva potpisa, korisnik čeka dve potvrde bloka.

Desno je tok koji sam implementirao koristeći EIP-7702 — podeljen je u tri faze. U prvoj fazi,
korisnik jednom, u podešavanjima novčanika, aktivira takozvani "pametni nalog" — to je jedna
transakcija tipa 4 koja deleguje kod na unapred objavljeni ugovor koji sam nazvao Approver.

Od tog trenutka, u drugoj fazi, svaki naredni depozit ide kroz jednu jedinu, običnu transakciju —
korisnik poziva funkciju approveAndDeposit direktno na svom EOA nalogu. Pošto EOA sada ima delegiran
Approver kod, EVM u okviru te jedne transakcije atomski izvršava i odobrenje i sam prenos sredstava.

Treća faza je opcionalna — kada korisnik želi da se vrati na običan EOA bez ikakvog koda, jednostavno
opozove delegaciju.

## 7-8. Implementacija — MultiSig i Approver (~2 min 30 s)

Pređimo sada na samu implementaciju. Sistem se sastoji od dva pametna ugovora, napisana u Solidity-ju,
razvijena i testirana Foundry alatom, i klijentske veb ekstenzije napisane u React-u i TypeScript-u,
koja sa mrežom komunicira preko ethers.js biblioteke, isključivo putem RPC čvora — nema sopstvenog
servera niti baze.

[Slajd MultiSig.] Prvi ugovor, MultiSig, čuva listu potpisnika kao mapiranje adresa u boolean —
to je namerna odluka: ugovor može da odgovori na pitanje "da li je ova adresa potpisnik", ali ne može
da nabroji sve potpisnike, pa to klijentska strana mora sama da zapamti u trenutku objavljivanja
ugovora. Tok je propose, sign, execute — svaki poziv proverava sve neophodne uslove pre nego što
sredstva stvarno napuste ugovor.

[Slajd Approver.] Drugi ugovor, Approver, je onaj koji se deleguje. Bitno ograničenje ovde — pošto se
kod izvršava u kontekstu EOA-a čiji je storage prazan, ovaj ugovor ne sme da se oslanja ni na kakvo
sopstveno stanje. Sve što mu treba prima kao parametre funkcije. Funkcija approveAndDeposit poziva
prethodne dve funkcije preko "this" — namerno, jer to garantuje da se address(this) razrešava na
adresu delegiranog EOA-a, a ne na adresu samog Approver ugovora. To je suptilnost koja, ako se
pogrešno implementira, čini da odobrenje tokena ide u ime pogrešnog naloga.

## 9. Bezbednosna analiza — nonce+1 (~1 min 30 s)

Ovo je deo rada na koji sam najponosniji, jer je to stvaran problem koji sam otkrio i rešio tokom
razvoja, ne nešto što sam unapred znao.

Kada je pošiljalac same transakcije tipa 4 istovremeno i potpisnik ovlašćenja unutar nje — što je
slučaj ovde, jer novčanik šalje transakciju samom sebi — postoji suptilna zamka. Protokol prvo obradi
"običan" deo transakcije, što uveća nonce pošiljaoca za jedan, i tek ONDA proverava authorization_list.
To znači da ovlašćenje mora nositi nonce vrednost jednaku trenutnom nonce-u plus jedan — ne trenutnom
nonce-u koji pročitate neposredno pre slanja transakcije.

Ako ovo pogrešite, transakcija se svejedno uspešno potvrdi na mreži — ne baca grešku — ali delegacija
tiho ne bude primenjena, jer ovlašćenje sa pogrešnim nonce-om biva odbačeno bez da to izazove neuspeh
cele transakcije. To sam otkrio upravo tako — transakcija je prolazila, a eth_getCode je i dalje
vraćao prazan kod.

[Pokazati stvarne podatke.] Da bih ovo dokazao, priložio sam stvarnu transakciju sa Sepolia mreže —
transakcija nosi nonce 2, a ovlašćenje unutar nje nosi nonce 3, tačno kao što teorija nalaže. Nakon
potvrde, eth_getCode zaista vraća delegacijski označivač sa adresom Approver ugovora.

## 10. Demo (~2-3 min, zavisi od snimka)

Sada ću pustiti kratak snimak koji demonstrira kompletan tok — od objavljivanja MultiSig ugovora,
preko predlaganja i potpisivanja transakcije od strane dva različita novčanika, klasičnog
dvotransakcionog depozita, aktivacije EIP-7702 delegacije, objedinjenog jednotransakcionog depozita,
pa sve do izvršenja transakcije. Sve što vidite je urađeno stvarnim transakcijama na Sepolia test
mreži, ne simulacija.

[Ako nema interneta ili se video ne učita: opisati tok usmeno uz snimke ekrana iz poglavlja 4 rada,
ili koristiti lokalni mp4 fallback ako je postavljen u `docs/media/demo.mp4`.]

## 11. Rezultati (~1 min)

Ovo su konkretni, izmereni brojevi sa Sepolia mreže, ne procena.

Klasičan depozit — dve odvojene transakcije, approve pa deposit — ukupno je koštao sto trinaest
hiljada šest stotina devedeset pet gasa, uz dva potpisivanja. Isti taj depozit, uz aktivnu EIP-7702
delegaciju, kroz jednu jedinu approveAndDeposit transakciju, koštao je šezdeset devet hiljada devet
stotina četrdeset devet gasa — jedno potpisivanje.

To je ušteda od približno trideset osam posto gasa, uz upola manje potpisivanja i čekanja na potvrdu
bloka. Ovo direktno dokazuje da EIP-7702 daje merljivu, ne samo teorijsku, prednost.

## 12-13. Ograničenja i zaključak (~1 min 30 s)

Da budem iskren o granicama ovog rada — sistem je testiran isključivo na Sepolia test mreži i nije
prošao nezavisnu bezbednosnu reviziju, što je preduslov za bilo kakvu ozbiljniju upotrebu. Upravljanje
privatnim ključem trenutno ne podržava standardizovane mnemoničke fraze niti hardverske novčanike.
I namerno sam ograničio obim rada na MultiSig i EIP-7702 — ugovor za društveni oporavak naloga
postoji u kodu, ali je svesno izostavljen iz rada jer ne uključuje EIP-7702 delegaciju.

Za kraj — ovaj rad pokazuje da kombinacija M-od-N višepotpisnog ugovora i EIP-7702 delegacije rešava
dva realna ograničenja EOA naloga, bez ikakve migracije identiteta, uz merljivo poboljšanje i u
broju transakcija i u potrošnji gasa. Verujem da isti obrazac — objedinjavanje više uzastopnih poziva
u jednu transakciju putem privremenog ponašanja poput pametnog ugovora — nije ograničen samo na ERC-20
depozit, već bi mogao postati opšti mehanizam za poboljšanje korisničkog iskustva u širem skupu
Ethereum aplikacija.

## 14. Hvala / Pitanja

Hvala na pažnji. Rado odgovaram na pitanja.

[Napomena: projekat je prvobitno nastao na Ethereum NS hackathon-u, gde smo Luka Ćirić i ja osvojili
prvo mesto — pomenuti samo ako se prirodno nametne, npr. ako neko pita otkud ideja za temu.]

---

## Anticipirana pitanja i kratki odgovori

- **Zašto ne Gnosis Safe / EIP-4337?** — Oba zahtevaju napuštanje EOA identiteta (migracija na novi
  nalog ili ugovor). Cilj ovog rada je bio upravo zadržati postojeći EOA, uz dodatak multisig-a i
  atomskog depozita.
- **Da li je delegacija trajna?** — Ne, ostaje dok je korisnik eksplicitno ne opozove novom
  transakcijom tipa 4 sa nultom adresom kao ciljem.
- **Šta ako je Approver ugovor kompromitovan?** — Approver je bezstanjski i ne čuva nikakva sredstva
  niti odobrenja trajno — svaki poziv prima sve podatke kao parametre. I dalje bi bila potrebna
  nezavisna revizija pre produkcione upotrebe (pomenuto u ograničenjima).
- **Zašto baš 38% ušteda, da li je to uvek tako?** — To je izmereno na konkretnom scenariju iz rada
  (jedan depozit, jedan token). Procenat zavisi od gasnih cena i veličine poziva, ali princip — jedna
  transakcija umesto dve — uvek eliminiše duplirani osnovni trošak transakcije (21000 gasa) i drugi
  potpis.
- **Da li radi na glavnoj mreži (mainnet)?** — Mehanizam je identičan, ali sistem namerno nije
  testiran niti bezbednosno pregledan za mainnet — to je jasno navedeno kao ograničenje i pravac
  budućeg rada.
