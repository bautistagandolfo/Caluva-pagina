(function () {
    var GATE_PASSWORD = 'Caluva2026';
    var STORAGE_KEY = 'caluva_gate_ok';

    if (sessionStorage.getItem(STORAGE_KEY) === '1') return;

    document.addEventListener('DOMContentLoaded', function () {
        // Bloquear el scroll mientras la cortina esté activa: se ve el hero
        // de fondo (video incluido) pero no se puede interactuar con la página.
        var previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        var style = document.createElement('style');
        style.textContent =
            '#caluva-gate{position:fixed;inset:0;z-index:999999;' +
            'background:rgba(4,10,15,0.45);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);' +
            'display:flex;align-items:center;justify-content:center;font-family:"Montserrat",sans-serif;' +
            'padding:1.5rem;}' +
            '#caluva-gate .gate-box{text-align:center;padding:2.2rem 2.4rem;max-width:360px;width:100%;' +
            'background:rgba(58,28,13,0.78);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
            'border:1px solid rgba(255,255,230,0.22);}' +
            '#caluva-gate .gate-text{color:rgba(255,255,230,0.85);font-size:0.72rem;font-weight:600;' +
            'letter-spacing:0.18em;text-transform:uppercase;margin-bottom:1.4rem;}' +
            '#caluva-gate form{display:flex;flex-direction:column;gap:0.7rem;}' +
            '#caluva-gate input{font-family:inherit;font-size:0.95rem;padding:0.8rem 1rem;' +
            'border:1px solid rgba(255,255,230,0.35);background:rgba(0,0,0,0.15);color:#ffffe6;' +
            'border-radius:0;outline:none;letter-spacing:0.05em;width:100%;box-sizing:border-box;' +
            'text-align:center;}' +
            '#caluva-gate input::placeholder{color:rgba(255,255,230,0.45);}' +
            '#caluva-gate button{font-family:inherit;font-weight:700;font-size:0.8rem;' +
            'letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;padding:0.8rem 1.2rem;' +
            'background:#ffffe6;color:#3a1c0d;border:none;transition:opacity 0.2s ease;}' +
            '#caluva-gate button:hover{opacity:0.85;}' +
            '#caluva-gate .gate-error{color:#f0b8a4;font-size:0.75rem;margin-top:0.9rem;letter-spacing:0.03em;}';
        document.head.appendChild(style);

        var gate = document.createElement('div');
        gate.id = 'caluva-gate';
        gate.innerHTML =
            '<div class="gate-box">' +
                '<p class="gate-text">Sitio en construcción<br>Ingresá la contraseña</p>' +
                '<form id="caluva-gate-form">' +
                    '<input type="password" id="caluva-gate-input" placeholder="CONTRASEÑA" autocomplete="off" required>' +
                    '<button type="submit">ENTRAR</button>' +
                '</form>' +
                '<p class="gate-error" id="caluva-gate-error" style="display:none;">Contraseña incorrecta, probá de nuevo.</p>' +
            '</div>';
        document.body.appendChild(gate);

        var input = document.getElementById('caluva-gate-input');
        var error = document.getElementById('caluva-gate-error');
        document.getElementById('caluva-gate-form').addEventListener('submit', function (e) {
            e.preventDefault();
            if (input.value === GATE_PASSWORD) {
                sessionStorage.setItem(STORAGE_KEY, '1');
                gate.remove();
                document.body.style.overflow = previousOverflow;
            } else {
                error.style.display = 'block';
                input.value = '';
                input.focus();
            }
        });
        input.focus();
    });
})();
