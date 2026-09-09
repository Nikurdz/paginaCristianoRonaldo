document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const form = document.getElementById('movieForm');
    const status = document.getElementById('formStatus');
    const rating = document.getElementById('rating');
    const ratingValue = document.getElementById('ratingValue');
    const fileInput = document.getElementById('poster');
    const maxFileSize = 2 * 1024 * 1024;

    const validationRules = [
        ['fullName', 'Escribe un nombre válido de 2 a 80 caracteres.'],
        ['email', 'Escribe un correo electrónico válido.'],
        ['phone', 'Escribe un teléfono válido o déjalo vacío.'],
        ['releaseDate', 'Selecciona una fecha válida entre 1900 y 2026.'],
        ['comments', 'El comentario no puede superar 500 caracteres.'],
        ['consent', 'Debes aceptar el tratamiento local de las preferencias.']
    ];

    const setFieldError = (id, message) => {
        const control = document.getElementById(id);
        const error = document.getElementById(`${id}Error`);
        const invalid = control && !control.validity.valid;
        if (control) control.setAttribute('aria-invalid', String(invalid));
        if (error) error.textContent = invalid ? message : '';
        return !invalid;
    };

    const validateFile = () => {
        const error = document.getElementById('posterError');
        const file = fileInput.files[0];
        const validType = !file || ['image/png', 'image/jpeg', 'image/webp'].includes(file.type);
        const validSize = !file || file.size <= maxFileSize;
        const valid = validType && validSize;
        fileInput.setAttribute('aria-invalid', String(!valid));
        error.textContent = valid ? '' : 'Elige una imagen PNG, JPG o WebP de máximo 2 MB.';
        return valid;
    };

    rating.addEventListener('input', () => {
        ratingValue.value = `${rating.value} de 10`;
        ratingValue.textContent = `${rating.value} de 10`;
    });

    fileInput.addEventListener('change', validateFile);

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        let valid = validationRules.every(([id, message]) => setFieldError(id, message));

        const genres = form.querySelectorAll('input[name="genre"]:checked');
        const genreError = document.getElementById('genreError');
        genreError.textContent = genres.length ? '' : 'Selecciona al menos un género.';
        valid = genres.length > 0 && valid;

        const format = form.querySelector('input[name="format"]:checked');
        const formatError = document.getElementById('formatError');
        formatError.textContent = format ? '' : 'Selecciona un formato.';
        valid = Boolean(format) && valid;
        valid = validateFile() && valid;

        if (!valid) {
            status.textContent = 'Revisa los campos indicados.';
            const firstInvalid = form.querySelector('[aria-invalid="true"]');
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        status.textContent = 'Preferencias guardadas solo en esta página. No se enviaron datos a un servidor.';
        form.reset();
        form.querySelectorAll('[aria-invalid]').forEach(control => control.removeAttribute('aria-invalid'));
        ratingValue.value = '5 de 10';
        ratingValue.textContent = '5 de 10';
    });

    form.addEventListener('reset', () => {
        window.setTimeout(() => {
            form.querySelectorAll('[aria-invalid]').forEach(control => control.removeAttribute('aria-invalid'));
            form.querySelectorAll('.field-error').forEach(error => { error.textContent = ''; });
            status.textContent = '';
            ratingValue.value = '5 de 10';
            ratingValue.textContent = '5 de 10';
        }, 0);
    });
});
