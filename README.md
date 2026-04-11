# sasm — Stupid ASseMbler

A tiny educational assembler for a custom 19-bit microinstruction CPU. Write
assembly in the browser, hit **Assemble**, and inspect every control signal
and the resulting opcode side-by-side.

## EBNF Grammar

```
program     := { line }
line        := [ label ] [ instruction ] [ comment ] NEWLINE
label       := IDENT ":"
comment     := ";" { ANY_CHAR }
instruction := mnemonic [ operand_list ]

operand_list := operand "," operand
operand      := register | NUMBER

mnemonic := "ldi" | "mov" | "add" | "sub" | "or" | "xor" | "and" | "nop"
register := "r1" | "r2" | "r3" | "acc" | "aux"
```

## Example

```asm
start:
    LDI ACC,6
    LDI R1,4
    LDI R2,5
    LDI R3,10
    MOV AUX,R1
    ADD ACC,AUX
    MOV AUX,R2
    SUB ACC,AUX
    MOV AUX,R3
    OR  ACC,AUX
    NOP
```

## License

Licensed under the MIT License. See [LICENSE](LICENSE) for details.
