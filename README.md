<div align="center">
  
<img width="800" alt="Cosmic Sonar" src="https://github.com/user-attachments/assets/fabb81d6-fe10-4ad0-99b3-0b4d630bb02c" />

  <h3>Progetto di Stage Interno - Università degli Studi di Padova</h3>
  <p>
    <b>Dipartimento di Matematica "Tullio Levi-Civita"</b><br>
    <b>Corso di Laurea:</b> Informatica (3° anno)<br>
    <b>Sviluppatore:</b> Siria Salvalaio (Matr. 2075520)<br>
    <b>Proponente:</b> Prof.ssa Ombretta Gaggi
  </p>
</div>

---

## Descrizione del Progetto
**Cosmic Sonar** è un videogioco web sperimentale basato sul paradigma **audio-first**, concepito per essere totalmente accessibile a utenti non vedenti o ipovedenti. Il progetto reinterpreta le meccaniche del classico arcade *Space Invaders*, trasformandolo in un esperimento di sonificazione spaziale.

L'applicativo utilizza le tecnologie Web per tradurre la posizione degli elementi di gioco in segnali acustici, permettendo l'orientamento spaziale anche senza il supporto del canale visivo.


## Meccaniche di Gioco
* **Struttura Survival:** Il giocatore deve resistere il più a lungo possibile a ondate nemiche via via più rapide.
* **Griglia di Gioco:** Il core engine è basato su una griglia a 3 colonne (estendibile a 5 nella modalità "Estrema").
* **Difficoltà Dinamica:** Un algoritmo incrementa lo *spawn rate* e la velocità dei nemici in base al tempo di sopravvivenza.
* **Target Lock:** Sistema di feedback acustico per segnalare l'allineamento con il nemico.


## Tecnologie Utilizzate
* **Core Logic:** JavaScript puro per la gestione dell'architettura software e degli eventi asincroni.
* **Audio Engine:** **Web Audio API** per la sintesi in tempo reale, gestione del panning stereo, variazione di frequenza (pitch) e timbro.
* **Interfaccia e Accessibilità:** HTML5 e CSS3 con implementazione rigorosa delle specifiche **WAI-ARIA** per la navigazione tramite screen reader.
* **Input:** Sistema ottimizzato per l'interazione esclusiva tramite tastiera.


## Funzionalità Principali
* **Tutorial Interattivo:** Macchina a stati strutturata in tre livelli progressivi per addestrare l'utente al riconoscimento dei segnali acustici.
* **Leaderboard Globale:** Sistema di salvataggio persistente dei punteggi e dei record di sopravvivenza.
* **Blackout Mode:** Modalità con schermo oscurato via software per testare l'efficacia della sonificazione spaziale anche su utenti vedenti.
* **Navigazione Semantica:** Menu, tutorial e classifiche sono pienamente esplorabili tramite tastiera e screen reader.


## Validazione e Test
Il software è sottoposto a due livelli di verifica:
1.  **Test di accessibilità tecnica:** Verifica della conformità del codice e funzionamento scollegato dal mouse.
2.  **User Testing:** Sessioni di "blindfolded testing" con utenti non vedenti, ipovedenti e vedenti per analizzare l'efficacia del mapping spaziale-acustico.


## Struttura del Piano di Lavoro
Il progetto segue i requisiti definiti nel piano ufficiale:
* **O (Obbligatori):** Motore Web Audio API, Tutorial in 3 fasi, Survival Mode a 3 colonne, Leaderboard.
* **D (Desiderabili):** Controlli touch per mobile, modalità a 5 colonne, data logging per analisi statistiche.
* **F (Facoltativi):** Integrazione Vibration API e bonus temporanei con effetti acustici unici.

---
*Progetto realizzato durante lo stage interno presso l'Università degli Studi di Padova - Maggio/Giugno 2026*.
