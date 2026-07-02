# Force XeLaTeX (needed for fontspec/polyglossia + Cyrillic mapping) and biber.
$pdf_mode = 5;          # 5 = xelatex
$bibtex_use = 2;        # run biber automatically
$xelatex = 'xelatex -synctex=1 -interaction=nonstopmode -file-line-error %O %S';
