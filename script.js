// --------------------- Usuarios ---------------------

function cargarUsuarios() {
  const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
  const selectModificar = document.getElementById('selectUsuarioModificar');
  selectModificar.innerHTML = '';
  usuarios.forEach((usuario, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${usuario.nombre} ${usuario.apellido} - ${usuario.cedula}`;
    selectModificar.appendChild(option);
  });
}

document.getElementById('formRegistroUsuario').addEventListener('submit', function(e) {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value;
  const apellido = document.getElementById('apellido').value;
  const cedula = document.getElementById('cedula').value;
  const regularidad = document.getElementById('regularidad').value;

  const nuevoUsuario = { nombre, apellido, cedula, regularidad };
  const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
  usuarios.push(nuevoUsuario);
  localStorage.setItem('usuarios', JSON.stringify(usuarios));
  cargarUsuarios();
  cargarUsuariosContribucion();
  alert('Usuario registrado exitosamente!');
  this.reset();
});

document.getElementById('formModificarUsuario').addEventListener('submit', function(e) {
  e.preventDefault();
  const index = document.getElementById('selectUsuarioModificar').value;
  const nombre = document.getElementById('nombreModificar').value;
  const apellido = document.getElementById('apellidoModificar').value;
  const cedula = document.getElementById('cedulaModificar').value;
  const regularidad = document.getElementById('regularidadModificar').value;

  const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
  if (usuarios[index]) {
    usuarios[index] = { nombre, apellido, cedula, regularidad };
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    cargarUsuarios();
    cargarUsuariosContribucion();
    alert('Usuario modificado exitosamente!');
    this.reset();
  }
});

// --------------------- Contribuciones ---------------------

function cargarUsuariosContribucion() {
  const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
  const selectContribucion = document.getElementById('selectUsuarioContribucion');
  selectContribucion.innerHTML = '';
  usuarios.forEach((usuario, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${usuario.nombre} ${usuario.apellido} - ${usuario.cedula}`;
    selectContribucion.appendChild(option);
  });
}

function cargarSemanasDisponibles() {
  const selectSemana = document.getElementById('semanaContribucion');
  const indexUsuario = document.getElementById('selectUsuarioContribucion').value;
  const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
  const usuario = usuarios[indexUsuario];

  const contribuciones = JSON.parse(localStorage.getItem('contribuciones')) || [];
  const semanasPagadas = contribuciones
    .filter(c => c.usuario.cedula === usuario.cedula)
    .map(c => c.semana);

  selectSemana.innerHTML = '';
  for (let i = 1; i <= 16; i++) {
    if (!semanasPagadas.includes(i)) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `Semana ${i}`;
      selectSemana.appendChild(option);
    }
  }
}

document.getElementById('selectUsuarioContribucion').addEventListener('change', cargarSemanasDisponibles);

document.getElementById('montoBs').addEventListener('input', calcularUnidadesCredito);
document.getElementById('tasaDia').addEventListener('input', calcularUnidadesCredito);

function calcularUnidadesCredito() {
  const montoBs = parseFloat(document.getElementById('montoBs').value) || 0;
  const tasaDia = parseFloat(document.getElementById('tasaDia').value) || 1;
  const montoDolar = montoBs / tasaDia;
  const unidadesCredito = montoDolar / 0.30;
  document.getElementById('resultadoUnidadesCredito').innerHTML = `<strong>Unidades de Crédito:</strong> ${unidadesCredito.toFixed(2)}`;
  return unidadesCredito;
}

document.getElementById('formRegistroContribucion').addEventListener('submit', function(e) {
  e.preventDefault();
  const indexUsuario = document.getElementById('selectUsuarioContribucion').value;
  const semana = parseInt(document.getElementById('semanaContribucion').value);
  const montoBs = parseFloat(document.getElementById('montoBs').value);
  const tasaDia = parseFloat(document.getElementById('tasaDia').value);
  const referencia = document.getElementById('referenciaPago').value;
  const unidadesCredito = calcularUnidadesCredito();

  const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
  const usuario = usuarios[indexUsuario];

  const contribuciones = JSON.parse(localStorage.getItem('contribuciones')) || [];
  const nuevaContribucion = {
    usuario,
    montoBs,
    tasaDia,
    referencia,
    unidadesCredito: unidadesCredito.toFixed(2),
    semana,
    fecha: new Date().toLocaleString()
  };

  contribuciones.push(nuevaContribucion);
  localStorage.setItem('contribuciones', JSON.stringify(contribuciones));

  mostrarFactura(nuevaContribucion);
  cargarSemanasDisponibles();
  registrarIngresoAutomatico(nuevaContribucion);
  cargarMovimientos();
  cargarTablaUnidadesCredito();
  actualizarSaldoDisponible();
  this.reset();
  calcularUnidadesCredito();
});

function mostrarFactura(contribucion) {
  const factura = `
    Nombre: ${contribucion.usuario.nombre} ${contribucion.usuario.apellido}<br>
    Cédula: ${contribucion.usuario.cedula}<br>
    Semana: ${contribucion.semana}<br>
    Monto Bs: ${contribucion.montoBs}<br>
    Tasa BCV: ${contribucion.tasaDia}<br>
    Unidades de Crédito: ${contribucion.unidadesCredito}<br>
    Referencia: ${contribucion.referencia}<br>
    Fecha: ${contribucion.fecha}<br><br>
    ${obtenerMensajeAgradecimiento()}
  `;
  document.getElementById('detalleFactura').innerHTML = factura;
  document.getElementById('facturaEmitida').style.display = 'block';
}

document.getElementById('botonCompartir').addEventListener('click', function() {
  const detalle = document.getElementById('detalleFactura').innerText;
  navigator.clipboard.writeText(detalle)
    .then(() => alert('Factura copiada al portapapeles!'))
    .catch(err => alert('Error al copiar: ' + err));
});

// --------------------- Movimientos Banco ---------------------

function cargarMovimientos() {
  const movimientos = JSON.parse(localStorage.getItem('movimientos')) || [];
  const lista = document.getElementById('listaMovimientos');
  lista.innerHTML = '';

  movimientos.forEach(mov => {
    const div = document.createElement('div');
    div.className = `movimiento ${mov.tipo}`;

    div.innerHTML = `
      <strong>${mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</strong><br>
      Fecha: ${mov.fecha}<br>
      ${mov.tipo === 'ingreso' ? `
        Cédula: ${mov.cedula}<br>
        Semana: ${mov.semana}<br>
        Referencia: ${mov.referencia}<br>
        Monto Bs: ${mov.monto}<br>
      ` : `
        Cuenta: ${mov.nombreCuenta}<br>
        Referencia: ${mov.referencia}<br>
        Tasa BCV: ${mov.tasa}<br>
        Nota: ${mov.nota}<br>
        Monto Bs: ${mov.monto}<br>
      `}
    `;
    lista.appendChild(div);
  });

  actualizarSaldoDisponible();
}

// Registrar Egreso
document.getElementById('formRegistrarEgreso').addEventListener('submit', function(e) {
  e.preventDefault();
  const nombreCuenta = document.getElementById('nombreCuentaEgreso').value;
  const monto = parseFloat(document.getElementById('montoEgreso').value);
  const referencia = document.getElementById('referenciaEgreso').value;
  const tasa = parseFloat(document.getElementById('tasaEgreso').value);
  const nota = document.getElementById('notaEgreso').value;

  const movimientos = JSON.parse(localStorage.getItem('movimientos')) || [];
  const nuevoEgreso = {
    tipo: 'egreso',
    nombreCuenta,
    monto,
    referencia,
    tasa,
    nota,
    fecha: new Date().toLocaleString()
  };

  movimientos.push(nuevoEgreso);
  localStorage.setItem('movimientos', JSON.stringify(movimientos));
  cargarMovimientos();
  alert('Egreso registrado exitosamente!');
  this.reset();
});

function registrarIngresoAutomatico(contribucion) {
  const movimientos = JSON.parse(localStorage.getItem('movimientos')) || [];
  const nuevoIngreso = {
    tipo: 'ingreso',
    cedula: contribucion.usuario.cedula,
    semana: contribucion.semana,
    monto: contribucion.montoBs,
    referencia: contribucion.referencia,
    fecha: contribucion.fecha
  };
  movimientos.push(nuevoIngreso);
  localStorage.setItem('movimientos', JSON.stringify(movimientos));
}

// --------------------- Saldo Disponible ---------------------

function actualizarSaldoDisponible() {
  const movimientos = JSON.parse(localStorage.getItem('movimientos')) || [];

  let totalIngresos = 0;
  let totalEgresos = 0;

  movimientos.forEach(mov => {
    if (mov.tipo === 'ingreso') {
      totalIngresos += parseFloat(mov.monto);
    } else if (mov.tipo === 'egreso') {
      totalEgresos += parseFloat(mov.monto);
    }
  });

  const saldo = totalIngresos - totalEgresos;
  const saldoElemento = document.getElementById('saldoDisponible');
  saldoElemento.textContent = `Saldo Disponible: Bs ${saldo.toFixed(2)}`;

  saldoElemento.style.color = saldo >= 0 ? 'green' : 'red';
}

// --------------------- Ajustes ---------------------

function obtenerMensajeAgradecimiento() {
  return localStorage.getItem('mensajeAgradecimiento') || 'GRACIAS POR TÚ CONTRIBUCIÓN :)';
}

document.getElementById('formMensajeAgradecimiento').addEventListener('submit', function(e) {
  e.preventDefault();
  const nuevoMensaje = document.getElementById('inputMensajeAgradecimiento').value;
  localStorage.setItem('mensajeAgradecimiento', nuevoMensaje);
  alert('Mensaje de agradecimiento actualizado.');
  this.reset();
});

document.getElementById('btnExportarJSON').addEventListener('click', function() {
  const datos = {
    usuarios: JSON.parse(localStorage.getItem('usuarios')) || [],
    contribuciones: JSON.parse(localStorage.getItem('contribuciones')) || [],
    movimientos: JSON.parse(localStorage.getItem('movimientos')) || [],
    mensajeAgradecimiento: localStorage.getItem('mensajeAgradecimiento') || 'GRACIAS POR TÚ CONTRIBUCIÓN :)'
  };
  
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'base_de_datos_contribuyentes.json';
  a.click();
  
  URL.revokeObjectURL(url);
});

document.getElementById('btnReiniciarDatos').addEventListener('click', function() {
  const confirmacion = confirm('¿Estás seguro que quieres eliminar TODOS los datos? Esta acción es irreversible.');
  if (confirmacion) {
    localStorage.clear();
    alert('¡Datos eliminados! El sistema se ha reiniciado.');
    location.reload();
  }
});

// --------------------- Inicialización ---------------------

window.addEventListener('load', function() {
  cargarUsuarios();
  cargarUsuariosContribucion();
  cargarSemanasDisponibles();
  cargarMovimientos();
  cargarTablaUnidadesCredito();
  actualizarSaldoDisponible();
});