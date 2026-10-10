"""Global look switch. 'webtoon' = clean line art + soft cel shading, pastel flesh, detailed eyes, fine hair strands (the series
style anchor and the two reference portraits); 'noir' = the earlier dark sepia treatment."""
import os

STYLE = os.environ.get("SF_STYLE", "webtoon")
WEB = STYLE == "webtoon"
LINE = (0.17, 0.11, 0.12)          # line-art colour: a dark warm brown, softer than pure black
