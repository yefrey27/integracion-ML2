# 🎨 Galería de Voz

Aplicación web que permite aplicar filtros artísticos a imágenes mediante **comandos de voz**, usando un modelo de reconocimiento de audio entrenado con Teachable Machine de Google.

---

## Archivos del proyecto

```
galeria.html   →  Estructura y marcado de la interfaz
galeria.css    →  Estilos (tema museo/galería)
galeria.js     →  Lógica: modelo de voz, filtros, navegación
```

> Los tres archivos deben estar en la **misma carpeta** para funcionar correctamente.

---

## Cómo usar

1. Abre `galeria.html` en un navegador moderno (Chrome recomendado).
2. Espera a que el modelo de audio termine de cargar.
3. Haz clic en el botón de micrófono 🎤 y acepta el permiso.
4. Sube una imagen arrastrándola o haciendo clic en la zona de carga.
5. Di un comando en voz alta para aplicar un filtro o navegar.

---

## Comandos disponibles

| Comando         | Acción                                      |
|-----------------|---------------------------------------------|
| `soplo`         | Aplica un efecto de desenfoque suave        |
| `siguiente`     | Muestra la siguiente imagen cargada         |
| `anterior`      | Muestra la imagen anterior                  |
| `abrir`         | Abre el selector de archivos                |
| `cerrar`        | Cierra la imagen actual                     |
| `guardar`       | Descarga la imagen con el filtro aplicado   |
| `pixel`         | Aplica efecto pixelado                      |
| `óleo`          | Aplica efecto de pintura al óleo            |
| `blanco y negro`| Convierte la imagen a escala de grises      |
| `original`      | Restaura la imagen sin filtros              |

---

## Tecnologías

- **TensorFlow.js** `v1.3.1` — inferencia del modelo en el navegador
- **Speech Commands** `v0.4.0` — reconocimiento de audio vía Teachable Machine
- **Canvas API** — procesamiento y renderizado de filtros de imagen
- **Cormorant Garamond + Josefin Sans** — tipografía vía Google Fonts

---

## Modelo de voz

El modelo fue entrenado con [Teachable Machine](https://teachablemachine.withgoogle.com/) y está alojado en:

```
https://teachablemachine.withgoogle.com/models/4jQIFUgrL/
```

El umbral de confianza para activar un comando es **75%**. Si el modelo no detecta el comando con suficiente certeza, lo ignora para evitar falsos positivos.

---

## Requisitos

- Navegador con soporte para **Web Audio API** y **Canvas API** (Chrome, Edge, Firefox recientes)
- Micrófono funcional
- Conexión a internet (para cargar el modelo y las fuentes)

---

## Notas

- Se pueden cargar **múltiples imágenes** a la vez y navegar entre ellas con voz.
- Las imágenes guardadas se descargan en formato `.png` con el nombre `galeria_<filtro>_<timestamp>.png`.
- El modelo puede tardar unos segundos en cargar dependiendo de la conexión.
