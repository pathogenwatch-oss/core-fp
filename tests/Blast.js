const { test } = require("ava");
const hasha = require("hasha");
const _ = require("lodash");

const { BlastParser } = require("../src/Blast");

test("Percentage identity", t => {
  const blastParser = new BlastParser();
  t.is(
    blastParser._pIdent({
      matchingBases: 10,
      alignmentLength: 100
    }),
    10,
    "10/100"
  );
  t.is(
    blastParser._pIdent({
      matchingBases: 98,
      alignmentLength: 99
    }),
    98.99,
    "98/99"
  );
  t.is(
    blastParser._pIdent({
      matchingBases: 94,
      alignmentLength: 99
    }),
    94.95,
    "94/99"
  );
});

test("Parse", async t => {
  const blastParser = new BlastParser();
  const blastOutput = `<?xml version="1.0"?>
<!DOCTYPE BlastOutput PUBLIC "-//NCBI//NCBI BlastOutput/EN" "http://www.ncbi.nlm.nih.gov/dtd/NCBI_BlastOutput.dtd">
<BlastOutput>
  <BlastOutput_program>blastn</BlastOutput_program>
  <BlastOutput_version>BLASTN 2.7.1+</BlastOutput_version>
  <BlastOutput_reference>Stephen F. Altschul, Thomas L. Madden, Alejandro A. Sch&amp;auml;ffer, Jinghui Zhang, Zheng Zhang, Webb Miller, and David J. Lipman (1997), &quot;Gapped BLAST and PSI-BLAST: a new generation of protein database search programs&quot;, Nucleic Acids Res. 25:3389-3402.</BlastOutput_reference>
  <BlastOutput_db>/usr/local/cgps-core-fp/databases/485/core.db</BlastOutput_db>
  <BlastOutput_query-ID>Query_1</BlastOutput_query-ID>
  <BlastOutput_query-def>ERR1549755.17328_4_44.1 Top Hit:WHO_G Neisseria gonorrhoeae WHO G</BlastOutput_query-def>
  <BlastOutput_query-len>305396</BlastOutput_query-len>
  <BlastOutput_param>
    <Parameters>
      <Parameters_expect>1e-35</Parameters_expect>
      <Parameters_sc-match>2</Parameters_sc-match>
      <Parameters_sc-mismatch>-3</Parameters_sc-mismatch>
      <Parameters_gap-open>5</Parameters_gap-open>
      <Parameters_gap-extend>2</Parameters_gap-extend>
      <Parameters_filter>L;m;</Parameters_filter>
    </Parameters>
  </BlastOutput_param>
<BlastOutput_iterations>
<Iteration>
  <Iteration_iter-num>1</Iteration_iter-num>
  <Iteration_query-ID>Query_1</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.1 Top Hit:WHO_G Neisseria gonorrhoeae WHO G</Iteration_query-def>
  <Iteration_query-len>305396</Iteration_query-len>
<Iteration_hits>
<Hit>
  <Hit_num>1</Hit_num>
  <Hit_id>gnl|BL_ORD_ID|3</Hit_id>
  <Hit_def>vapA</Hit_def>
  <Hit_accession>3</Hit_accession>
  <Hit_len>483</Hit_len>
  <Hit_hsps>
    <Hsp>
      <Hsp_num>1</Hsp_num>
      <Hsp_bit-score>866.903</Hsp_bit-score>
      <Hsp_score>960</Hsp_score>
      <Hsp_evalue>0</Hsp_evalue>
      <Hsp_query-from>270073</Hsp_query-from>
      <Hsp_query-to>270555</Hsp_query-to>
      <Hsp_hit-from>1</Hsp_hit-from>
      <Hsp_hit-to>483</Hsp_hit-to>
      <Hsp_query-frame>1</Hsp_query-frame>
      <Hsp_hit-frame>1</Hsp_hit-frame>
      <Hsp_identity>482</Hsp_identity>
      <Hsp_positive>482</Hsp_positive>
      <Hsp_gaps>0</Hsp_gaps>
      <Hsp_align-len>483</Hsp_align-len>
      <Hsp_qseq>ATGCAGTTTTACCTGCAACCGCAGGCGCAGTTTACCTACTTGGGCGTAAACGGCGGCTTTACCGACAGCGAGGGGCGGCGGTCGGGCTGCTCGGCAGCGGTCAGTGGCAAATCCGCGCCGGCATTCGGGCAAAAACCCGTTTTGCTTTGCGTAACGGTGTCAATCTTCAGCCTTTTGCCGCTTTTAATGTTTTGCACAGGTCAAAATCTTTCGGCATGGAAATGGACGGCGAAAAACAGACGCTGGCAGGCAGGACGGCGCTCGAAGGGCGGTTTGGCATTGAAGCCGGTTGGAAAGGCCATATGTCCGCACGCATCGGATACGGCAAAAGGACGGACGGCGACAAAGAAGCCGCATTGTCGGTCAAATGGTTGTTTTGATGCGCCGGGAAATGTTTTGACGCACAGGCGGCACACCTGCACGGCCCCGTGCGCCGCCCCGCAAACCGATCCGAACCCTGCCGCCCCGAAGGGCGGGGCATAA</Hsp_qseq>
      <Hsp_hseq>ATGCAGTTTTACCTGCAACCGCAGGCGCAGTTTACCTACTTGGGCGTAAACGGCGGCTTTACCGACAGCGAGGGGCGGCGGTCGGGCTGCTCGGCAGCGGTCAGTGGCAAATCCGCGCCGGCATTCGGGCAAAAACCCGTTTTGCTTTGCGTAACGGTGTCAATCTTCAGCCTTTTGCCGCTTTTAATGTTTTGCACAGGTCAAAATCTTTCGGCATGGAAATGGACGGCGAAAAACAGACGCTGGCAGGCAGGACGGCGCTCGAAGGGCGGTTTGGCATTGAAGCCGGTTGGAAAGGCCATATGTCCGCACGCATCGGATACGGCAAAAGGACGGACGGCGACAAAGAAGCCGCATTGTCGGTCAAATGGTTGTTTTGATGCGCCGGGAAATGTTTTGACACACAGGCGGCACACCTGCACGGCCCCGTGCGCCGCCCCGCAAACCGATCCGAACCCTGCCGCCCCGAAGGGCGGGGCATAA</Hsp_hseq>
      <Hsp_midline>||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||</Hsp_midline>
    </Hsp>
  </Hit_hsps>
</Hit>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>22</Statistics_hsp-len>
      <Statistics_eff-space>539290484</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
</Iteration>
<Iteration>
  <Iteration_iter-num>2</Iteration_iter-num>
  <Iteration_query-ID>Query_2</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.3 Top Hit:WHO_G Neisseria gonorrhoeae WHO G</Iteration_query-def>
  <Iteration_query-len>208536</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>22</Statistics_hsp-len>
      <Statistics_eff-space>368235724</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>3</Iteration_iter-num>
  <Iteration_query-ID>Query_3</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.2 Top Hit:NC_002946.2 Neisseria gonorrhoeae FA 1090 chromosome, complete genome</Iteration_query-def>
  <Iteration_query-len>215185</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>22</Statistics_hsp-len>
      <Statistics_eff-space>379977858</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>4</Iteration_iter-num>
  <Iteration_query-ID>Query_4</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.5 Top Hit:WHO_O Neisseria gonorrhoeae WHO O</Iteration_query-def>
  <Iteration_query-len>170314</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>21</Statistics_hsp-len>
      <Statistics_eff-space>301418610</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>5</Iteration_iter-num>
  <Iteration_query-ID>Query_5</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.4 Top Hit:WHO_V Neisseria gonorrhoeae WHO V</Iteration_query-def>
  <Iteration_query-len>199338</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>22</Statistics_hsp-len>
      <Statistics_eff-space>351992056</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>6</Iteration_iter-num>
  <Iteration_query-ID>Query_6</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.7 Top Hit:WHO_K Neisseria gonorrhoeae WHO K</Iteration_query-def>
  <Iteration_query-len>102680</Iteration_query-len>
<Iteration_hits>
<Hit>
  <Hit_num>1</Hit_num>
  <Hit_id>gnl|BL_ORD_ID|1</Hit_id>
  <Hit_def>group_2700</Hit_def>
  <Hit_accession>1</Hit_accession>
  <Hit_len>813</Hit_len>
  <Hit_hsps>
    <Hsp>
      <Hsp_num>1</Hsp_num>
      <Hsp_bit-score>1467.43</Hsp_bit-score>
      <Hsp_score>1626</Hsp_score>
      <Hsp_evalue>0</Hsp_evalue>
      <Hsp_query-from>25576</Hsp_query-from>
      <Hsp_query-to>26388</Hsp_query-to>
      <Hsp_hit-from>813</Hsp_hit-from>
      <Hsp_hit-to>1</Hsp_hit-to>
      <Hsp_query-frame>1</Hsp_query-frame>
      <Hsp_hit-frame>-1</Hsp_hit-frame>
      <Hsp_identity>813</Hsp_identity>
      <Hsp_positive>813</Hsp_positive>
      <Hsp_gaps>0</Hsp_gaps>
      <Hsp_align-len>813</Hsp_align-len>
      <Hsp_qseq>TCATTTCCACAACGCGCGTTTCAACATAATCAACCAATCCTTCTTATCCAAAACGGGGCGTTGTGCAAACACATCGTATCGGCACGCGTCCAGTTTCTGCAAAATCAACTGCGCCCCCAACACAATCATACGGAGTTCCAAACCGATACGCCCTTTCAATTCGCGCGCCAAAGGCGAACCCGCCTTCAGCATACGGAATGCACGCCGGCACTCATACGCCATCAGCCGCTGAAACGCCGCATCCGCCCGTCCTGCTGCGATCTGTTCCTCAGAAACACCGAATTTCAACAAATCGTCCTGCGGGATATAAACCCTGCCCTTTTGCCAATCCACAGCTACATCCTGCCAAAAATTCACCAGTTGCAAAGCCGTACAAATACCGTCGCTTTGCGCTACGCACACCGCATCCGTTTTCCCGTATAAAGCCAGCATAATGCGTCCGACAGGGTTGGCGGAACGCCGGCAATAATCGGTCAGATCGCCGAAATGCGCGTACCGCGTTTTAACCACATCCTGCGAAAACGCCGAGAGCAGATCATAAAACGGCTGCAAATCCAAACCGAACGGCACAACCGCCTCGGCATCCAATCGTGCAATCAAAGGATGCGCCGACCGGCCGCCCGATGCCAACACGTCCAACTCGCGCCGCAAACCCTCCAACCCCGACAACCTGGCTTCAGACGGCATACTGCCCTCGTCCGCCATATCGTCCGCCGTCCGTGCAAACGCATACACCGCATGAACCGGCTTCCTCAACCTGCGCGGCAAAACCAGCGAACCGACGGGAAAATTCTCATAATGCCCAACCGACAT</Hsp_qseq>
      <Hsp_hseq>TCATTTCCACAACGCGCGTTTCAACATAATCAACCAATCCTTCTTATCCAAAACGGGGCGTTGTGCAAACACATCGTATCGGCACGCGTCCAGTTTCTGCAAAATCAACTGCGCCCCCAACACAATCATACGGAGTTCCAAACCGATACGCCCTTTCAATTCGCGCGCCAAAGGCGAACCCGCCTTCAGCATACGGAATGCACGCCGGCACTCATACGCCATCAGCCGCTGAAACGCCGCATCCGCCCGTCCTGCTGCGATCTGTTCCTCAGAAACACCGAATTTCAACAAATCGTCCTGCGGGATATAAACCCTGCCCTTTTGCCAATCCACAGCTACATCCTGCCAAAAATTCACCAGTTGCAAAGCCGTACAAATACCGTCGCTTTGCGCTACGCACACCGCATCCGTTTTCCCGTATAAAGCCAGCATAATGCGTCCGACAGGGTTGGCGGAACGCCGGCAATAATCGGTCAGATCGCCGAAATGCGCGTACCGCGTTTTAACCACATCCTGCGAAAACGCCGAGAGCAGATCATAAAACGGCTGCAAATCCAAACCGAACGGCACAACCGCCTCGGCATCCAATCGTGCAATCAAAGGATGCGCCGACCGGCCGCCCGATGCCAACACGTCCAACTCGCGCCGCAAACCCTCCAACCCCGACAACCTGGCTTCAGACGGCATACTGCCCTCGTCCGCCATATCGTCCGCCGTCCGTGCAAACGCATACACCGCATGAACCGGCTTCCTCAACCTGCGCGGCAAAACCAGCGAACCGACGGGAAAATTCTCATAATGCCCAACCGACAT</Hsp_hseq>
      <Hsp_midline>|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||</Hsp_midline>
    </Hsp>
  </Hit_hsps>
</Hit>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>21</Statistics_hsp-len>
      <Statistics_eff-space>181706430</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
</Iteration>
<Iteration>
  <Iteration_iter-num>7</Iteration_iter-num>
  <Iteration_query-ID>Query_7</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.6 Top Hit:WHO_G Neisseria gonorrhoeae WHO G</Iteration_query-def>
  <Iteration_query-len>127825</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>21</Statistics_hsp-len>
      <Statistics_eff-space>226213080</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>8</Iteration_iter-num>
  <Iteration_query-ID>Query_8</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.9 Top Hit:WHO_G Neisseria gonorrhoeae WHO G</Iteration_query-def>
  <Iteration_query-len>84410</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>20</Statistics_hsp-len>
      <Statistics_eff-space>149707860</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>9</Iteration_iter-num>
  <Iteration_query-ID>Query_9</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.8 Top Hit:WHO_O Neisseria gonorrhoeae WHO O</Iteration_query-def>
  <Iteration_query-len>95592</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>21</Statistics_hsp-len>
      <Statistics_eff-space>169160670</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>10</Iteration_iter-num>
  <Iteration_query-ID>Query_10</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.24 Top Hit:NC_002946.2 Neisseria gonorrhoeae FA 1090 chromosome, complete genome</Iteration_query-def>
  <Iteration_query-len>13743</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>18</Statistics_hsp-len>
      <Statistics_eff-space>24457950</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>11</Iteration_iter-num>
  <Iteration_query-ID>Query_11</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.25 Top Hit:NC_002946.2 Neisseria gonorrhoeae FA 1090 chromosome, complete genome</Iteration_query-def>
  <Iteration_query-len>11388</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>18</Statistics_hsp-len>
      <Statistics_eff-space>20261340</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>12</Iteration_iter-num>
  <Iteration_query-ID>Query_12</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.26 Top Hit:WHO_G Neisseria gonorrhoeae WHO G</Iteration_query-def>
  <Iteration_query-len>9420</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>18</Statistics_hsp-len>
      <Statistics_eff-space>16754364</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>13</Iteration_iter-num>
  <Iteration_query-ID>Query_13</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.27 Top Hit:WHO_O Neisseria gonorrhoeae WHO O</Iteration_query-def>
  <Iteration_query-len>8171</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>17</Statistics_hsp-len>
      <Statistics_eff-space>14563044</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>14</Iteration_iter-num>
  <Iteration_query-ID>Query_14</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.20 Top Hit:WHO_G Neisseria gonorrhoeae WHO G</Iteration_query-def>
  <Iteration_query-len>25653</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>19</Statistics_hsp-len>
      <Statistics_eff-space>45577252</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>15</Iteration_iter-num>
  <Iteration_query-ID>Query_15</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.21 Top Hit:NZ_CP012027.1 Neisseria gonorrhoeae strain FA6140, complete genome</Iteration_query-def>
  <Iteration_query-len>23973</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>19</Statistics_hsp-len>
      <Statistics_eff-space>42590212</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>16</Iteration_iter-num>
  <Iteration_query-ID>Query_16</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.22 Top Hit:NC_002946.2 Neisseria gonorrhoeae FA 1090 chromosome, complete genome</Iteration_query-def>
  <Iteration_query-len>17386</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>18</Statistics_hsp-len>
      <Statistics_eff-space>30949776</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>17</Iteration_iter-num>
  <Iteration_query-ID>Query_17</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.23 Top Hit:WHO_P Neisseria gonorrhoeae WHO P</Iteration_query-def>
  <Iteration_query-len>14695</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>18</Statistics_hsp-len>
      <Statistics_eff-space>26154414</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>18</Iteration_iter-num>
  <Iteration_query-ID>Query_18</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.28 Top Hit:WHO_P Neisseria gonorrhoeae WHO P</Iteration_query-def>
  <Iteration_query-len>7699</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>17</Statistics_hsp-len>
      <Statistics_eff-space>13720052</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>19</Iteration_iter-num>
  <Iteration_query-ID>Query_19</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.29 Top Hit:WHO_L Neisseria gonorrhoeae WHO L</Iteration_query-def>
  <Iteration_query-len>7346</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>17</Statistics_hsp-len>
      <Statistics_eff-space>13089594</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>20</Iteration_iter-num>
  <Iteration_query-ID>Query_20</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.19 Top Hit:WHO_M Neisseria gonorrhoeae WHO M</Iteration_query-def>
  <Iteration_query-len>26533</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>19</Statistics_hsp-len>
      <Statistics_eff-space>47141892</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>21</Iteration_iter-num>
  <Iteration_query-ID>Query_21</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.18 Top Hit:WHO_K Neisseria gonorrhoeae WHO K</Iteration_query-def>
  <Iteration_query-len>26560</Iteration_query-len>
<Iteration_hits>
<Hit>
  <Hit_num>1</Hit_num>
  <Hit_id>gnl|BL_ORD_ID|2</Hit_id>
  <Hit_def>group_3366</Hit_def>
  <Hit_accession>2</Hit_accession>
  <Hit_len>339</Hit_len>
  <Hit_hsps>
    <Hsp>
      <Hsp_num>1</Hsp_num>
      <Hsp_bit-score>542.297</Hsp_bit-score>
      <Hsp_score>600</Hsp_score>
      <Hsp_evalue>2.6681e-156</Hsp_evalue>
      <Hsp_query-from>1</Hsp_query-from>
      <Hsp_query-to>305</Hsp_query-to>
      <Hsp_hit-from>35</Hsp_hit-from>
      <Hsp_hit-to>339</Hsp_hit-to>
      <Hsp_query-frame>1</Hsp_query-frame>
      <Hsp_hit-frame>1</Hsp_hit-frame>
      <Hsp_identity>303</Hsp_identity>
      <Hsp_positive>303</Hsp_positive>
      <Hsp_gaps>0</Hsp_gaps>
      <Hsp_align-len>305</Hsp_align-len>
      <Hsp_qseq>CTATGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGCCATTCCCGCGCTGCAATGGGACATCGGCGGCAGCGGGGCGGTTTTCCCTTCGCTCGCACTGTTTCTGCTCTGTTTCATCATAGGTATGCACAACACGGGGATGACGCTTCTGCCGGGCGGTGCAATCTGTTCGACGCACATGGCCCGGCACGGCAGCCGACTTGGGCATCGAAATCCCGCGCGTGCCGTACTATAGTGGATTAA</Hsp_qseq>
      <Hsp_hseq>CTATGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGTCATTCCCGCGCTGCAATGGGACATCGGCGGCAGCGGGGCGGTTTTCCCTTCGCTCGCACTGTTTCTGCTCTGTTTCATCATAGGTATGCACAACACGGGGATGACGCTTCTGCCGGGCGGTGCAATCCGTTCGACGCACATGGCCCGGCACGGCAGCCGACTTGGGCATCGAAATCCCGCGCGTGCCGTACTATAGTGGATTAA</Hsp_hseq>
      <Hsp_midline>|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||</Hsp_midline>
    </Hsp>
  </Hit_hsps>
</Hit>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>19</Statistics_hsp-len>
      <Statistics_eff-space>47189898</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
</Iteration>
<Iteration>
  <Iteration_iter-num>22</Iteration_iter-num>
  <Iteration_query-ID>Query_22</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.15 Top Hit:WHO_O Neisseria gonorrhoeae WHO O</Iteration_query-def>
  <Iteration_query-len>48690</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>20</Statistics_hsp-len>
      <Statistics_eff-space>86340580</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>23</Iteration_iter-num>
  <Iteration_query-ID>Query_23</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.14 Top Hit:WHO_G Neisseria gonorrhoeae WHO G</Iteration_query-def>
  <Iteration_query-len>55274</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>20</Statistics_hsp-len>
      <Statistics_eff-space>98020596</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>24</Iteration_iter-num>
  <Iteration_query-ID>Query_24</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.17 Top Hit:WHO_M Neisseria gonorrhoeae WHO M</Iteration_query-def>
  <Iteration_query-len>28236</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>19</Statistics_hsp-len>
      <Statistics_eff-space>50169826</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>25</Iteration_iter-num>
  <Iteration_query-ID>Query_25</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.16 Top Hit:WHO_L Neisseria gonorrhoeae WHO L</Iteration_query-def>
  <Iteration_query-len>38651</Iteration_query-len>
<Iteration_hits>
<Hit>
  <Hit_num>1</Hit_num>
  <Hit_id>gnl|BL_ORD_ID|0</Hit_id>
  <Hit_def>group_540</Hit_def>
  <Hit_accession>0</Hit_accession>
  <Hit_len>219</Hit_len>
  <Hit_hsps>
    <Hsp>
      <Hsp_num>1</Hsp_num>
      <Hsp_bit-score>396.224</Hsp_bit-score>
      <Hsp_score>438</Hsp_score>
      <Hsp_evalue>3.64375e-112</Hsp_evalue>
      <Hsp_query-from>33105</Hsp_query-from>
      <Hsp_query-to>33323</Hsp_query-to>
      <Hsp_hit-from>219</Hsp_hit-from>
      <Hsp_hit-to>1</Hsp_hit-to>
      <Hsp_query-frame>1</Hsp_query-frame>
      <Hsp_hit-frame>-1</Hsp_hit-frame>
      <Hsp_identity>219</Hsp_identity>
      <Hsp_positive>219</Hsp_positive>
      <Hsp_gaps>0</Hsp_gaps>
      <Hsp_align-len>219</Hsp_align-len>
      <Hsp_qseq>TTACCAAGCAAACGGTTTCCGCTTCATATCCGAAAGGTTGTCAACTTCATTATCCAGCAAGAACTGCTCAAAAGCATTCCAACCTTTCTTTTCCACCAATTCTGCTTCCTGTTTATACAAGGGGACAAGCAAAGGGAAAACGATATTGTAGTGTTCGCCATAACAGACCTGAAAATCATCATCGAAATAAAATGGGGCGGAAACATACAGTGCATCCAT</Hsp_qseq>
      <Hsp_hseq>TTACCAAGCAAACGGTTTCCGCTTCATATCCGAAAGGTTGTCAACTTCATTATCCAGCAAGAACTGCTCAAAAGCATTCCAACCTTTCTTTTCCACCAATTCTGCTTCCTGTTTATACAAGGGGACAAGCAAAGGGAAAACGATATTGTAGTGTTCGCCATAACAGACCTGAAAATCATCATCGAAATAAAATGGGGCGGAAACATACAGTGCATCCAT</Hsp_hseq>
      <Hsp_midline>|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||</Hsp_midline>
    </Hsp>
  </Hit_hsps>
</Hit>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>19</Statistics_hsp-len>
      <Statistics_eff-space>68687696</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
</Iteration>
<Iteration>
  <Iteration_iter-num>26</Iteration_iter-num>
  <Iteration_query-ID>Query_26</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.11 Top Hit:WHO_L Neisseria gonorrhoeae WHO L</Iteration_query-def>
  <Iteration_query-len>61246</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>20</Statistics_hsp-len>
      <Statistics_eff-space>108614924</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>27</Iteration_iter-num>
  <Iteration_query-ID>Query_27</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.10 Top Hit:WHO_M Neisseria gonorrhoeae WHO M</Iteration_query-def>
  <Iteration_query-len>72736</Iteration_query-len>
<Iteration_hits>
<Hit>
  <Hit_num>1</Hit_num>
  <Hit_id>gnl|BL_ORD_ID|0</Hit_id>
  <Hit_def>group_540</Hit_def>
  <Hit_accession>0</Hit_accession>
  <Hit_len>219</Hit_len>
  <Hit_hsps>
    <Hsp>
      <Hsp_num>1</Hsp_num>
      <Hsp_bit-score>336.713</Hsp_bit-score>
      <Hsp_score>372</Hsp_score>
      <Hsp_evalue>5.62212e-94</Hsp_evalue>
      <Hsp_query-from>3411</Hsp_query-from>
      <Hsp_query-to>3629</Hsp_query-to>
      <Hsp_hit-from>1</Hsp_hit-from>
      <Hsp_hit-to>219</Hsp_hit-to>
      <Hsp_query-frame>1</Hsp_query-frame>
      <Hsp_hit-frame>1</Hsp_hit-frame>
      <Hsp_identity>206</Hsp_identity>
      <Hsp_positive>206</Hsp_positive>
      <Hsp_gaps>0</Hsp_gaps>
      <Hsp_align-len>219</Hsp_align-len>
      <Hsp_qseq>ATGGACGCACTGTATGTTTCCGCCCCATTTTATTTCGACGATGATTTCCAAGTCTGTTATGGCGAACACTACAATATTGTTTTCCCTTTGCTTGTCCCCTTGTATAAACAGGAAGCCGAATTGGTGGAAAAAAAGGGTTGGAATGCTTTTGAGCAGTTCTTGTTGGATAATGAAGTTGGCAACCTTTCGGATATGAATAGGAAACCGTTTGTTTGGTAA</Hsp_qseq>
      <Hsp_hseq>ATGGATGCACTGTATGTTTCCGCCCCATTTTATTTCGATGATGATTTTCAGGTCTGTTATGGCGAACACTACAATATCGTTTTCCCTTTGCTTGTCCCCTTGTATAAACAGGAAGCAGAATTGGTGGAAAAGAAAGGTTGGAATGCTTTTGAGCAGTTCTTGCTGGATAATGAAGTTGACAACCTTTCGGATATGAAGCGGAAACCGTTTGCTTGGTAA</Hsp_hseq>
      <Hsp_midline>||||| |||||||||||||||||||||||||||||||| |||||||| || |||||||||||||||||||||||||| |||||||||||||||||||||||||||||||||||||| |||||||||||||| || ||||||||||||||||||||||||||| ||||||||||||||| ||||||||||||||||||  |||||||||||| |||||||</Hsp_midline>
    </Hsp>
  </Hit_hsps>
</Hit>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>20</Statistics_hsp-len>
      <Statistics_eff-space>128998184</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
</Iteration>
<Iteration>
  <Iteration_iter-num>28</Iteration_iter-num>
  <Iteration_query-ID>Query_28</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.13 Top Hit:WHO_K Neisseria gonorrhoeae WHO K</Iteration_query-def>
  <Iteration_query-len>55460</Iteration_query-len>
<Iteration_hits>
<Hit>
  <Hit_num>1</Hit_num>
  <Hit_id>gnl|BL_ORD_ID|2</Hit_id>
  <Hit_def>group_3366</Hit_def>
  <Hit_accession>2</Hit_accession>
  <Hit_len>339</Hit_len>
  <Hit_hsps>
    <Hsp>
      <Hsp_num>1</Hsp_num>
      <Hsp_bit-score>259.168</Hsp_bit-score>
      <Hsp_score>286</Hsp_score>
      <Hsp_evalue>9.44979e-71</Hsp_evalue>
      <Hsp_query-from>55315</Hsp_query-from>
      <Hsp_query-to>55460</Hsp_query-to>
      <Hsp_hit-from>1</Hsp_hit-from>
      <Hsp_hit-to>146</Hsp_hit-to>
      <Hsp_query-frame>1</Hsp_query-frame>
      <Hsp_hit-frame>1</Hsp_hit-frame>
      <Hsp_identity>145</Hsp_identity>
      <Hsp_positive>145</Hsp_positive>
      <Hsp_gaps>0</Hsp_gaps>
      <Hsp_align-len>146</Hsp_align-len>
      <Hsp_qseq>ATGCGGCGGGCTGAAGCCCGCCCTGCAACCCTCTCTATGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGCCATTCCCGCGC</Hsp_qseq>
      <Hsp_hseq>ATGCGGCGGGCTGAAGCCCGCCCTGCAACCCTCTCTATGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGTCATTCCCGCGC</Hsp_hseq>
      <Hsp_midline>|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| |||||||||||</Hsp_midline>
    </Hsp>
  </Hit_hsps>
</Hit>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>20</Statistics_hsp-len>
      <Statistics_eff-space>98350560</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
</Iteration>
<Iteration>
  <Iteration_iter-num>29</Iteration_iter-num>
  <Iteration_query-ID>Query_29</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.12 Top Hit:WHO_N Neisseria gonorrhoeae WHO N</Iteration_query-def>
  <Iteration_query-len>60271</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>20</Statistics_hsp-len>
      <Statistics_eff-space>106885274</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>30</Iteration_iter-num>
  <Iteration_query-ID>Query_30</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.37 Top Hit:WHO_F Neisseria gonorrhoeae WHO F</Iteration_query-def>
  <Iteration_query-len>1722</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>15</Statistics_hsp-len>
      <Statistics_eff-space>3062358</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>31</Iteration_iter-num>
  <Iteration_query-ID>Query_31</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.36 Top Hit:WHO_G Neisseria gonorrhoeae WHO G</Iteration_query-def>
  <Iteration_query-len>2729</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>16</Statistics_hsp-len>
      <Statistics_eff-space>4856270</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>32</Iteration_iter-num>
  <Iteration_query-ID>Query_32</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.35 Top Hit:WHO_F Neisseria gonorrhoeae WHO F</Iteration_query-def>
  <Iteration_query-len>2884</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>16</Statistics_hsp-len>
      <Statistics_eff-space>5133720</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>33</Iteration_iter-num>
  <Iteration_query-ID>Query_33</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.34 Top Hit:WHO_L Neisseria gonorrhoeae WHO L</Iteration_query-def>
  <Iteration_query-len>3333</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>16</Statistics_hsp-len>
      <Statistics_eff-space>5937430</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>34</Iteration_iter-num>
  <Iteration_query-ID>Query_34</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.33 Top Hit:WHO_O_pCryptic Neisseria gonorrhoeae WHO O Cryptic plasmid</Iteration_query-def>
  <Iteration_query-len>4376</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>17</Statistics_hsp-len>
      <Statistics_eff-space>7785174</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>35</Iteration_iter-num>
  <Iteration_query-ID>Query_35</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.32 Top Hit:WHO_K Neisseria gonorrhoeae WHO K</Iteration_query-def>
  <Iteration_query-len>4782</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>17</Statistics_hsp-len>
      <Statistics_eff-space>8510290</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>36</Iteration_iter-num>
  <Iteration_query-ID>Query_36</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.31 Top Hit:WHO_G Neisseria gonorrhoeae WHO G</Iteration_query-def>
  <Iteration_query-len>4865</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>17</Statistics_hsp-len>
      <Statistics_eff-space>8658528</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
<Iteration>
  <Iteration_iter-num>37</Iteration_iter-num>
  <Iteration_query-ID>Query_37</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.30 Top Hit:WHO_L Neisseria gonorrhoeae WHO L</Iteration_query-def>
  <Iteration_query-len>7146</Iteration_query-len>
<Iteration_hits>
<Hit>
  <Hit_num>1</Hit_num>
  <Hit_id>gnl|BL_ORD_ID|2</Hit_id>
  <Hit_def>group_3366</Hit_def>
  <Hit_accession>2</Hit_accession>
  <Hit_len>339</Hit_len>
  <Hit_hsps>
    <Hsp>
      <Hsp_num>1</Hsp_num>
      <Hsp_bit-score>192.443</Hsp_bit-score>
      <Hsp_score>212</Hsp_score>
      <Hsp_evalue>1.49168e-51</Hsp_evalue>
      <Hsp_query-from>1</Hsp_query-from>
      <Hsp_query-to>109</Hsp_query-to>
      <Hsp_hit-from>38</Hsp_hit-from>
      <Hsp_hit-to>146</Hsp_hit-to>
      <Hsp_query-frame>1</Hsp_query-frame>
      <Hsp_hit-frame>1</Hsp_hit-frame>
      <Hsp_identity>108</Hsp_identity>
      <Hsp_positive>108</Hsp_positive>
      <Hsp_gaps>0</Hsp_gaps>
      <Hsp_align-len>109</Hsp_align-len>
      <Hsp_qseq>TGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGCCATTCCCGCGC</Hsp_qseq>
      <Hsp_hseq>TGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGTCATTCCCGCGC</Hsp_hseq>
      <Hsp_midline>||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| |||||||||||</Hsp_midline>
    </Hsp>
  </Hit_hsps>
</Hit>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>17</Statistics_hsp-len>
      <Statistics_eff-space>12732394</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
</Iteration>
<Iteration>
  <Iteration_iter-num>38</Iteration_iter-num>
  <Iteration_query-ID>Query_38</Iteration_query-ID>
  <Iteration_query-def>ERR1549755.17328_4_44.38 Top Hit:WHO_K Neisseria gonorrhoeae WHO K</Iteration_query-def>
  <Iteration_query-len>861</Iteration_query-len>
<Iteration_hits>
</Iteration_hits>
  <Iteration_stat>
    <Statistics>
      <Statistics_db-num>4</Statistics_db-num>
      <Statistics_db-len>1854</Statistics_db-len>
      <Statistics_hsp-len>15</Statistics_hsp-len>
      <Statistics_eff-space>1517724</Statistics_eff-space>
      <Statistics_kappa>0.41</Statistics_kappa>
      <Statistics_lambda>0.625</Statistics_lambda>
      <Statistics_entropy>0.78</Statistics_entropy>
    </Statistics>
  </Iteration_stat>
  <Iteration_message>No hits found</Iteration_message>
</Iteration>
</BlastOutput_iterations>
</BlastOutput>`;

  const expected = [
    {
      hitAccession: "3",
      hitId: "vapA",
      hitSequence: "ATGCAGTTTTACCTGCAACCGCAGGCGCAGTTTACCTACTTGGGCGTAAACGGCGGCTTTACCGACAGCGAGGGGCGGCGGTCGGGCTGCTCGGCAGCGGTCAGTGGCAAATCCGCGCCGGCATTCGGGCAAAAACCCGTTTTGCTTTGCGTAACGGTGTCAATCTTCAGCCTTTTGCCGCTTTTAATGTTTTGCACAGGTCAAAATCTTTCGGCATGGAAATGGACGGCGAAAAACAGACGCTGGCAGGCAGGACGGCGCTCGAAGGGCGGTTTGGCATTGAAGCCGGTTGGAAAGGCCATATGTCCGCACGCATCGGATACGGCAAAAGGACGGACGGCGACAAAGAAGCCGCATTGTCGGTCAAATGGTTGTTTTGATGCGCCGGGAAATGTTTTGACACACAGGCGGCACACCTGCACGGCCCCGTGCGCCGCCCCGCAAACCGATCCGAACCCTGCCGCCCCGAAGGGCGGGGCATAA",
      hitStart: 1,
      hitEnd: 483,
      reverse: false,
      queryId: "ERR1549755.17328_4_44.1 Top Hit:WHO_G Neisseria gonorrhoeae WHO G",
      querySequence: "ATGCAGTTTTACCTGCAACCGCAGGCGCAGTTTACCTACTTGGGCGTAAACGGCGGCTTTACCGACAGCGAGGGGCGGCGGTCGGGCTGCTCGGCAGCGGTCAGTGGCAAATCCGCGCCGGCATTCGGGCAAAAACCCGTTTTGCTTTGCGTAACGGTGTCAATCTTCAGCCTTTTGCCGCTTTTAATGTTTTGCACAGGTCAAAATCTTTCGGCATGGAAATGGACGGCGAAAAACAGACGCTGGCAGGCAGGACGGCGCTCGAAGGGCGGTTTGGCATTGAAGCCGGTTGGAAAGGCCATATGTCCGCACGCATCGGATACGGCAAAAGGACGGACGGCGACAAAGAAGCCGCATTGTCGGTCAAATGGTTGTTTTGATGCGCCGGGAAATGTTTTGACGCACAGGCGGCACACCTGCACGGCCCCGTGCGCCGCCCCGCAAACCGATCCGAACCCTGCCGCCCCGAAGGGCGGGGCATAA",
      queryStart: 270073,
      queryEnd: 270555,
      matchingBases: 482,
      alignmentLength: 483,
      eValue: 0,
      pIdent: 99.79
    },
    {
      hitAccession: "1",
      hitId: "group_2700",
      hitSequence: "TCATTTCCACAACGCGCGTTTCAACATAATCAACCAATCCTTCTTATCCAAAACGGGGCGTTGTGCAAACACATCGTATCGGCACGCGTCCAGTTTCTGCAAAATCAACTGCGCCCCCAACACAATCATACGGAGTTCCAAACCGATACGCCCTTTCAATTCGCGCGCCAAAGGCGAACCCGCCTTCAGCATACGGAATGCACGCCGGCACTCATACGCCATCAGCCGCTGAAACGCCGCATCCGCCCGTCCTGCTGCGATCTGTTCCTCAGAAACACCGAATTTCAACAAATCGTCCTGCGGGATATAAACCCTGCCCTTTTGCCAATCCACAGCTACATCCTGCCAAAAATTCACCAGTTGCAAAGCCGTACAAATACCGTCGCTTTGCGCTACGCACACCGCATCCGTTTTCCCGTATAAAGCCAGCATAATGCGTCCGACAGGGTTGGCGGAACGCCGGCAATAATCGGTCAGATCGCCGAAATGCGCGTACCGCGTTTTAACCACATCCTGCGAAAACGCCGAGAGCAGATCATAAAACGGCTGCAAATCCAAACCGAACGGCACAACCGCCTCGGCATCCAATCGTGCAATCAAAGGATGCGCCGACCGGCCGCCCGATGCCAACACGTCCAACTCGCGCCGCAAACCCTCCAACCCCGACAACCTGGCTTCAGACGGCATACTGCCCTCGTCCGCCATATCGTCCGCCGTCCGTGCAAACGCATACACCGCATGAACCGGCTTCCTCAACCTGCGCGGCAAAACCAGCGAACCGACGGGAAAATTCTCATAATGCCCAACCGACAT",
      hitStart: 1,
      hitEnd: 813,
      reverse: true,
      queryId: "ERR1549755.17328_4_44.7 Top Hit:WHO_K Neisseria gonorrhoeae WHO K",
      querySequence: "TCATTTCCACAACGCGCGTTTCAACATAATCAACCAATCCTTCTTATCCAAAACGGGGCGTTGTGCAAACACATCGTATCGGCACGCGTCCAGTTTCTGCAAAATCAACTGCGCCCCCAACACAATCATACGGAGTTCCAAACCGATACGCCCTTTCAATTCGCGCGCCAAAGGCGAACCCGCCTTCAGCATACGGAATGCACGCCGGCACTCATACGCCATCAGCCGCTGAAACGCCGCATCCGCCCGTCCTGCTGCGATCTGTTCCTCAGAAACACCGAATTTCAACAAATCGTCCTGCGGGATATAAACCCTGCCCTTTTGCCAATCCACAGCTACATCCTGCCAAAAATTCACCAGTTGCAAAGCCGTACAAATACCGTCGCTTTGCGCTACGCACACCGCATCCGTTTTCCCGTATAAAGCCAGCATAATGCGTCCGACAGGGTTGGCGGAACGCCGGCAATAATCGGTCAGATCGCCGAAATGCGCGTACCGCGTTTTAACCACATCCTGCGAAAACGCCGAGAGCAGATCATAAAACGGCTGCAAATCCAAACCGAACGGCACAACCGCCTCGGCATCCAATCGTGCAATCAAAGGATGCGCCGACCGGCCGCCCGATGCCAACACGTCCAACTCGCGCCGCAAACCCTCCAACCCCGACAACCTGGCTTCAGACGGCATACTGCCCTCGTCCGCCATATCGTCCGCCGTCCGTGCAAACGCATACACCGCATGAACCGGCTTCCTCAACCTGCGCGGCAAAACCAGCGAACCGACGGGAAAATTCTCATAATGCCCAACCGACAT",
      queryStart: 25576,
      queryEnd: 26388,
      matchingBases: 813,
      alignmentLength: 813,
      eValue: 0,
      pIdent: 100
    },
    {
      hitAccession: "2",
      hitId: "group_3366",
      hitSequence: "CTATGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGTCATTCCCGCGCTGCAATGGGACATCGGCGGCAGCGGGGCGGTTTTCCCTTCGCTCGCACTGTTTCTGCTCTGTTTCATCATAGGTATGCACAACACGGGGATGACGCTTCTGCCGGGCGGTGCAATCCGTTCGACGCACATGGCCCGGCACGGCAGCCGACTTGGGCATCGAAATCCCGCGCGTGCCGTACTATAGTGGATTAA",
      hitStart: 35,
      hitEnd: 339,
      reverse: false,
      queryId: "ERR1549755.17328_4_44.18 Top Hit:WHO_K Neisseria gonorrhoeae WHO K",
      querySequence: "CTATGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGCCATTCCCGCGCTGCAATGGGACATCGGCGGCAGCGGGGCGGTTTTCCCTTCGCTCGCACTGTTTCTGCTCTGTTTCATCATAGGTATGCACAACACGGGGATGACGCTTCTGCCGGGCGGTGCAATCTGTTCGACGCACATGGCCCGGCACGGCAGCCGACTTGGGCATCGAAATCCCGCGCGTGCCGTACTATAGTGGATTAA",
      queryStart: 1,
      queryEnd: 305,
      matchingBases: 303,
      alignmentLength: 305,
      eValue: 2.6681e-156,
      pIdent: 99.34
    },
    {
      hitAccession: "0",
      hitId: "group_540",
      hitSequence: "TTACCAAGCAAACGGTTTCCGCTTCATATCCGAAAGGTTGTCAACTTCATTATCCAGCAAGAACTGCTCAAAAGCATTCCAACCTTTCTTTTCCACCAATTCTGCTTCCTGTTTATACAAGGGGACAAGCAAAGGGAAAACGATATTGTAGTGTTCGCCATAACAGACCTGAAAATCATCATCGAAATAAAATGGGGCGGAAACATACAGTGCATCCAT",
      hitStart: 1,
      hitEnd: 219,
      reverse: true,
      queryId: "ERR1549755.17328_4_44.16 Top Hit:WHO_L Neisseria gonorrhoeae WHO L",
      querySequence: "TTACCAAGCAAACGGTTTCCGCTTCATATCCGAAAGGTTGTCAACTTCATTATCCAGCAAGAACTGCTCAAAAGCATTCCAACCTTTCTTTTCCACCAATTCTGCTTCCTGTTTATACAAGGGGACAAGCAAAGGGAAAACGATATTGTAGTGTTCGCCATAACAGACCTGAAAATCATCATCGAAATAAAATGGGGCGGAAACATACAGTGCATCCAT",
      queryStart: 33105,
      queryEnd: 33323,
      matchingBases: 219,
      alignmentLength: 219,
      eValue: 3.64375e-112,
      pIdent: 100
    },
    {
      hitAccession: "0",
      hitId: "group_540",
      hitSequence: "ATGGATGCACTGTATGTTTCCGCCCCATTTTATTTCGATGATGATTTTCAGGTCTGTTATGGCGAACACTACAATATCGTTTTCCCTTTGCTTGTCCCCTTGTATAAACAGGAAGCAGAATTGGTGGAAAAGAAAGGTTGGAATGCTTTTGAGCAGTTCTTGCTGGATAATGAAGTTGACAACCTTTCGGATATGAAGCGGAAACCGTTTGCTTGGTAA",
      hitStart: 1,
      hitEnd: 219,
      reverse: false,
      queryId: "ERR1549755.17328_4_44.10 Top Hit:WHO_M Neisseria gonorrhoeae WHO M",
      querySequence: "ATGGACGCACTGTATGTTTCCGCCCCATTTTATTTCGACGATGATTTCCAAGTCTGTTATGGCGAACACTACAATATTGTTTTCCCTTTGCTTGTCCCCTTGTATAAACAGGAAGCCGAATTGGTGGAAAAAAAGGGTTGGAATGCTTTTGAGCAGTTCTTGTTGGATAATGAAGTTGGCAACCTTTCGGATATGAATAGGAAACCGTTTGTTTGGTAA",
      queryStart: 3411,
      queryEnd: 3629,
      matchingBases: 206,
      alignmentLength: 219,
      eValue: 5.62212e-94,
      pIdent: 94.06
    },
    {
      hitAccession: "2",
      hitId: "group_3366",
      hitSequence: "ATGCGGCGGGCTGAAGCCCGCCCTGCAACCCTCTCTATGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGTCATTCCCGCGC",
      hitStart: 1,
      hitEnd: 146,
      reverse: false,
      queryId: "ERR1549755.17328_4_44.13 Top Hit:WHO_K Neisseria gonorrhoeae WHO K",
      querySequence: "ATGCGGCGGGCTGAAGCCCGCCCTGCAACCCTCTCTATGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGCCATTCCCGCGC",
      queryStart: 55315,
      queryEnd: 55460,
      matchingBases: 145,
      alignmentLength: 146,
      eValue: 9.44979e-71,
      pIdent: 99.32
    },
    {
      hitAccession: "2",
      hitId: "group_3366",
      hitSequence: "TGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGTCATTCCCGCGC",
      hitStart: 38,
      hitEnd: 146,
      reverse: false,
      queryId: "ERR1549755.17328_4_44.30 Top Hit:WHO_L Neisseria gonorrhoeae WHO L",
      querySequence: "TGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGCCATTCCCGCGC",
      queryStart: 1,
      queryEnd: 109,
      matchingBases: 108,
      alignmentLength: 109,
      eValue: 1.49168e-51,
      pIdent: 99.08
    }
  ];

  function format(hits) {
    const hashHit = ({ queryId }) =>
      hasha(queryId, { algorithm: "sha1" }).slice(0, 6);
    return _.keyBy(hits, hashHit);
  }

  const actual = await blastParser.parse(blastOutput);

  t.deepEqual(format(actual), format(expected));
});
