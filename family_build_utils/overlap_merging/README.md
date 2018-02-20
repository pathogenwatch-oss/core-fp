Pipeline for merging genes into 'pseudocontigs' & library validation

1. Generate cores for references using debug mode of the core-fp container

```
e.g. to run on 7 cores:
find . -name "*.fasta" -print0 | xargs -P 7 -0 -I fasta sh -c 'docker run -i --rm -e DEBUG="*,-trace*" -e WGSA_ORGANISM_TAXID=485 -v $(PWD):/data registry.gitlab.com/cgps/cgps-core-fp:new-gono-and-equi debug /data/${1} > ${1}.json' -- fasta
```
2. Generate "pseudocontigs" by running `create_pseudo_contigs.py` on each assembly
    * Creates an output file containing location, direction and family name.
    * Contains a known bug that means encapsulated overlaps are not correctly detected.
```
find . -name "*.json" -print0 | xargs -I json -P 7 -0 sh -c 'python3 create_pseudo_contigs.py ${1} > ${1}.pc' -- json

Contig ID, Start, Stop, Resolved Name, Resolved orientation, Merged Families ('-' = reverse strand, '*' = fragment), Length
SE4047,2242945,2243967,trsA,-,trsA-,1023
SE4047,2244384,2245256,SEQ_2232,+,SEQ_2232,873
SE4047,2245336,2246955,SEQ_2233,+,SEQ_2233,1620
```
3. Review paralogy by running `aggregate_family_matches` on each `.pc` file.
    * Simply counts the number of occurrences of each family and sorts
    * Investigate the families with multiple matches at the top of the list and decide what to do.
```
find . -name "*.pc" -print0 | xargs -I json -P 7 -0 sh -c 'python3 aggregate_family_matches.py ${1} > ${1}.summary' -- json
```
4. Create family distribution file by running `complete_only.py`
    * Only includes pseudocontigs built from complete matches.
    * Examine families that don't have complete matches in every assembly. Normally it's down to variants in the start or end codons, but occasionally it's something else that can resolved or indicates a family should be removed. 
```
e.g. In the directory with the .pc files:
python3 complete_only.py . > complete_families.lst
``` 
5. Extract all the new merged family ids from that list with `grep '__' complete_families.lst > selected_pc.txt`
6. Extract all the singleton ids with `grep -v '__' complete_families.lst > selected_singletons.txt`
7. Extract new representatives for the merged families
    * Generate the merged family FASTAs with `python3 generate_pc_fastas.py selected_pc [path to reference fastas & .pc files]`
    * Outputs an unaligned FASTA for each merged family.
    * Align all the FASTAs with `for i in *.fasta; do mafft --auto --thread 7 $i > $i.ali; done`.
    * Check all the alignments have square edges with `for i in *.ali; do python3 check_alignment_edges.py $i; done`
      * If not, "fix" the ragged ones. 
    * Extract representatives with `for i in *.ali; do python3 select_representative.py $i >> merged_reps.fa; done`.
8. Extract the singleton representatives from the old core.csv with `python3 select_singletons.py selected_singletons.txt core.csv > singletons.fa`
9. `cat singletons.fa merged_reps.fa > all_reps.fa`
10. Check the new families for cross-hits and further refine.
    * `makeblastdb -in all_reps.fa -dbtype nucl -out new_core`
    * `blastn -query all_reps.fa -db new_core -outfmt 6 -num_alignments 4000 > cross_hits.tab`
    * Use the `check_crosshits.ipynb` to investigate the cross hits in `cross_hits.tab`.
11. Run `check_pc_paralogues.py` on the final FASTA (update the ID filter for the species) to look for any families that occur in more than once. These should have been removed during the cross-hits stage.
12. ???
13. Profit