"""
Validadores de contenido reutilizables entre distintos esquemas.
"""
import re
import unicodedata

PATRON_REPETITIVO = re.compile(r"(.)\1{5,}")
PATRON_LETRAS = re.compile(r"[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]")
PATRON_CARACTERES_CONTROL = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F]")
PATRON_PALABRA_REPETIDA = re.compile(r"\b(\w+)(\s+\1\b){3,}", re.IGNORECASE)


def normalizar_texto(v: str) -> str:
    """Normaliza Unicode (NFC) y quita espacios sobrantes. Usar en mode='before'."""
    v = unicodedata.normalize("NFC", v)
    return v.strip()


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
    """Rechaza contenido donde más del 80% son caracteres no alfanuméricos."""
    if len(v) > 5:
        alfanum_o_espacio = sum(1 for c in v if c.isalnum() or c.isspace())
        if alfanum_o_espacio / len(v) < 0.2:
            raise ValueError("contiene demasiados caracteres especiales sin significado")
    return v