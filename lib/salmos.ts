// Lista de salmos bíblicos para exibição nas etiquetas
export const salmos = [
  { referencia: "Salmos 23:1", texto: "O Senhor é o meu pastor, nada me faltará." },
  {
    referencia: "Salmos 91:11",
    texto: "Porque aos seus anjos dará ordem a teu respeito, para te guardarem em todos os teus caminhos.",
  },
  { referencia: "Salmos 37:4", texto: "Deleita-te também no Senhor, e ele te concederá o que deseja o teu coração." },
  { referencia: "Salmos 46:1", texto: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia." },
  { referencia: "Salmos 27:1", texto: "O Senhor é a minha luz e a minha salvação; a quem temerei?" },
  { referencia: "Salmos 119:105", texto: "Lâmpada para os meus pés é a tua palavra e luz para o meu caminho." },
  { referencia: "Salmos 34:8", texto: "Provai e vede que o Senhor é bom; bem-aventurado o homem que nele confia." },
  {
    referencia: "Salmos 103:2-3",
    texto: "Bendize, ó minha alma, ao Senhor, e não te esqueças de nenhum de seus benefícios.",
  },
  {
    referencia: "Salmos 19:14",
    texto: "Sejam agradáveis as palavras da minha boca e a meditação do meu coração perante a tua face.",
  },
  { referencia: "Salmos 56:3", texto: "Quando eu tiver medo, confiarei em ti." },
  { referencia: "Salmos 118:24", texto: "Este é o dia que o Senhor fez; regozijemo-nos e alegremo-nos nele." },
  { referencia: "Salmos 121:7-8", texto: "O Senhor te guardará de todo mal; ele guardará a tua vida." },
  { referencia: "Salmos 139:14", texto: "Eu te louvarei, porque de um modo terrível e tão maravilhoso fui formado." },
  {
    referencia: "Salmos 145:9",
    texto: "O Senhor é bom para todos, e as suas misericórdias são sobre todas as suas obras.",
  },
  {
    referencia: "Salmos 16:11",
    texto: "Tu me farás conhecer a vereda da vida; na tua presença há plenitude de alegria.",
  },
  { referencia: "Salmos 30:5", texto: "O choro pode durar uma noite, mas a alegria vem pela manhã." },
  {
    referencia: "Salmos 32:8",
    texto: "Instruir-te-ei e ensinar-te-ei o caminho que deves seguir; guiar-te-ei com os meus olhos.",
  },
  { referencia: "Salmos 34:18", texto: "Perto está o Senhor dos que têm o coração quebrantado." },
  {
    referencia: "Salmos 37:23-24",
    texto: "Os passos do homem bom são confirmados pelo Senhor, e ele se compraz no seu caminho.",
  },
  { referencia: "Salmos 55:22", texto: "Lança o teu cuidado sobre o Senhor, e ele te susterá." },
  { referencia: "Salmos 62:1-2", texto: "A minha alma espera somente em Deus; dele vem a minha salvação." },
  { referencia: "Salmos 84:11", texto: "O Senhor Deus é sol e escudo; o Senhor dará graça e glória." },
  { referencia: "Salmos 86:5", texto: "Pois tu, Senhor, és bom, e pronto a perdoar, e abundante em benignidade." },
  { referencia: "Salmos 90:12", texto: "Ensina-nos a contar os nossos dias, para que alcancemos coração sábio." },
  {
    referencia: "Salmos 103:13",
    texto: "Como um pai se compadece de seus filhos, assim o Senhor se compadece dos que o temem.",
  },
  {
    referencia: "Salmos 107:1",
    texto: "Louvai ao Senhor, porque ele é bom, porque a sua benignidade dura para sempre.",
  },
  { referencia: "Salmos 116:1-2", texto: "Amo ao Senhor, porque ele ouviu a minha voz e a minha súplica." },
  { referencia: "Salmos 119:11", texto: "Escondi a tua palavra no meu coração, para não pecar contra ti." },
  { referencia: "Salmos 126:5", texto: "Os que semeiam em lágrimas, com alegria ceifarão." },
  { referencia: "Salmos 133:1", texto: "Oh! quão bom e quão suave é que os irmãos vivam em união!" },
]

/**
 * Retorna um salmo aleatório da lista
 */
export function getSalmoAleatorio() {
  const indiceAleatorio = Math.floor(Math.random() * salmos.length)
  return salmos[indiceAleatorio]
}
