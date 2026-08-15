"""
Validadores de contenido reutilizables entre distintos esquemas.
"""
import re
import unicodedata

from ...core.config import settings

PATRON_REPETITIVO = re.compile(r"(.)\1{5,}")
PATRON_LETRAS = re.compile(r"[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]")
PATRON_CARACTERES_CONTROL = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F]")
PATRON_PALABRA_REPETIDA = re.compile(r"\b(\w+)(\s+\1\b){3,}", re.IGNORECASE)
PATRON_SEPARADOR_REPETIDO = re.compile(r"([-_])\1")


def normalizar_texto(v: str) -> str:
    """Normaliza Unicode (NFC) y quita espacios sobrantes. Usar en mode='before'."""
    v = unicodedata.normalize("NFC", v)
    return v.strip()


def normalizar_opcional(v: str | None) -> str | None:
    """Normaliza un campo opcional; cadena vacía o solo espacios → ``None``.

    Permite que el cliente omita el campo o mande ``""`` sin romper la
    validación, y que el valor persista como ``NULL`` en la BD.
    """
    if v is None:
        return None
    v = normalizar_texto(v)
    return v or None


def rechazar_caracteres_control(v: str) -> str:
    """Rechaza caracteres de control invisibles, incluyendo el carácter nulo."""
    if PATRON_CARACTERES_CONTROL.search(v) or "\x00" in v:
        raise ValueError("contiene caracteres de control no permitidos")
    return v


def rechazar_patrones_repetitivos(v: str) -> str:
    """Rechaza el mismo carácter repetido 6+ veces seguidas."""
    if PATRON_REPETITIVO.search(v):
        raise ValueError(
            "contiene patrones repetitivos sin significado (ej. '-----', '!!!!!', '33333')"
        )
    return v


def rechazar_palabra_repetida(v: str) -> str:
    """Rechaza la misma palabra repetida 4+ veces seguidas."""
    if PATRON_PALABRA_REPETIDA.search(v):
        raise ValueError("contiene la misma palabra repetida varias veces seguidas")
    return v


def rechazar_solo_especiales(v: str) -> str:
    """Rechaza contenido sin ninguna letra."""
    solo_letras = PATRON_LETRAS.sub("", v)
    if not solo_letras:
        raise ValueError(
            "debe contener al menos una letra, no solo caracteres especiales o números"
        )
    return v


def rechazar_demasiado_ruido(v: str) -> str:
    """Rechaza contenido donde más del X% son caracteres no alfanuméricos."""
    min_longitud = settings.validacion_min_longitud
    max_ruido = settings.validacion_max_ruido

    if len(v) > min_longitud:
        alfanum_o_espacio = sum(1 for c in v if c.isalnum() or c.isspace())
        if alfanum_o_espacio / len(v) < (1.0 - max_ruido):
            raise ValueError("contiene demasiados caracteres especiales sin significado")
    return v


def rechazar_separadores_repetidos(v: str) -> str:
    """Rechaza guiones o guiones bajos duplicados seguidos (``a--b``, ``c__d``).

    Permite hiphenaciones legítimas con un solo separador (``Ana-María``),
    pero bloquea patrones tipo ``a--b--c--d`` sin significado.
    """
    if PATRON_SEPARADOR_REPETIDO.search(v):
        raise ValueError("contiene guiones o guiones bajos repetidos seguidos (ej. 'a--b')")
    return v
