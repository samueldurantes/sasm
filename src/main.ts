import { EditorView, basicSetup } from "codemirror";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { StreamLanguage, StringStream } from "@codemirror/language";
import { Lexer } from "./tokenizer";

const MNEMONICS = new Set([
  "ldi",
  "mov",
  "add",
  "sub",
  "or",
  "xor",
  "and",
  "nop",
]);
const REGISTERS = new Set(["r1", "r2", "r3", "acc", "aux"]);

const sasmLang = StreamLanguage.define<{}>({
  name: "sasm",
  startState: () => ({}),
  token(stream: StringStream) {
    if (stream.eatSpace()) return null;
    if (stream.match(/^;.*/)) return "comment";
    if (stream.match(/^\d+/)) return "number";
    if (stream.match(/^[,:]/)) return "punctuation";
    const word = stream.match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (word) {
      const w = (word as RegExpMatchArray)[0].toLowerCase();
      if (MNEMONICS.has(w)) return "keyword";
      if (REGISTERS.has(w)) return "variableName";
      if (stream.peek() === ":") return "labelName";
      return "name";
    }
    stream.next();
    return null;
  },
});
import { Parser } from "./parser";
import { Assembler } from "./assembler";

const FIELDS = [
  "extdataout",
  "r1in",
  "r1out",
  "r2in",
  "r2out",
  "r3in",
  "r3out",
  "accin",
  "accout",
  "auxin",
  "andout",
  "orout",
  "xorout",
  "addsub",
  "addout",
  "di3",
  "di2",
  "di1",
  "di0",
] as const;

const DEFAULT_SOURCE = `start:
    NOP
`;

const editorParent = document.getElementById("editor") as HTMLDivElement;
const runBtn = document.getElementById("run") as HTMLButtonElement;
const errorEl = document.getElementById("error") as HTMLDivElement;
const tableWrap = document.getElementById("table-wrap") as HTMLDivElement;

const view = new EditorView({
  doc: DEFAULT_SOURCE,
  extensions: [basicSetup, keymap.of([indentWithTab]), sasmLang],
  parent: editorParent,
});

function assemble(source: string) {
  const tokens = new Lexer(source).tokenize();
  const program = new Parser(tokens).parse_program();
  return new Assembler(program.instructions).mount();
}

function render(results: ReturnType<typeof assemble>) {
  const thead = `
    <thead>
      <tr>
        <th>#</th>
        ${FIELDS.map((f) => `<th>${f}</th>`).join("")}
        <th>opcode</th>
      </tr>
    </thead>`;

  const rows = results
    .map((r, i) => {
      const cells = FIELDS.map((f) => {
        const v = (r.microinstructions as Record<string, number>)[f] ?? 0;
        return `<td class="${v ? "on" : "off"}">${v}</td>`;
      }).join("");
      return `<tr><td>${i}</td>${cells}<td>${r.opcode}</td></tr>`;
    })
    .join("");

  tableWrap.innerHTML = `<table>${thead}<tbody>${rows}</tbody></table>`;
}

function run() {
  errorEl.textContent = "";
  try {
    const results = assemble(view.state.doc.toString());
    render(results);
  } catch (e) {
    tableWrap.innerHTML = "";
    errorEl.textContent = (e as Error).message;
  }
}

runBtn.addEventListener("click", run);
run();
