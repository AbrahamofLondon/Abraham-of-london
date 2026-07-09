import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getPublicCrossEditionReview } from "@/lib/intelligence/accountability/cross-edition-call-review";
import {
  InstitutionalSurfaceShell, SurfaceCover, StateBadge, EvidenceMeta, SectionLedger,
  MetricStatement, MethodologyReceipt, PreviewBanner,
  EmptyEvidenceState, RelationshipNavigator, brass, brassLight, evidenceGrey,
} from "@/components/institutional";