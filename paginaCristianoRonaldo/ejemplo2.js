document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const form = document.getElementById('feedbackForm');
    const status = document.getElementById('formStatus');
    const fields = [
        { id: 'name', message: 'Escribe tu nombre.' },
        { id: 'email', message: 'Escribe un correo electrónico válido.' },
        { id: 'message', message: 'Escribe un mensaje de entre 10 y 500 caracteres.' },
        { id: 'consent', message: 'Debes aceptar el uso del mensaje para continuar.' }
    ];

    const setError = (control, message) => {
        const error = document.getElementById(`${control.id}Error`);
        control.setAttribute('aria-invalid', String(!control.validity.valid));
        if (error) error.textContent = control.validity.valid ? '' : message;
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        let isValid = true;

        fields.forEach(({ id, message }) => {
            const control = document.getElementById(id);
            setError(control, message);
            if (!control.validity.valid) isValid = false;
        });

        const favorite = form.querySelector('input[name="favorite"]:checked');
        const favoriteError = document.getElementById('favoriteError');
        if (!favorite) {
            favoriteError.textContent = 'Selecciona una sección.';
            isValid = false;
        } else {
            favoriteError.textContent = '';
        }

        if (!isValid) {
            status.textContent = 'Revisa los campos indicados.';
            const firstInvalid = form.querySelector('[aria-invalid="true"], input[name="favorite"]:not(:checked), #consent:not(:checked)');
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        status.textContent = 'Formulario enviado correctamente. Gracias por tu opinión.';
        form.reset();
        form.querySelectorAll('[aria-invalid]').forEach(control => control.removeAttribute('aria-invalid'));
    });

    form.addEventListener('reset', () => {
        window.setTimeout(() => {
            form.querySelectorAll('[aria-invalid]').forEach(control => control.removeAttribute('aria-invalid'));
            form.querySelectorAll('.field-error').forEach(error => { error.textContent = ''; });
            status.textContent = '';
        }, 0);
    });
});
