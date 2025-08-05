import { CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { OverflowNode } from "@lexical/overflow";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
  Klass,
  LexicalNode,
  LexicalNodeReplacement,
  ParagraphNode,
  TextNode,
} from "lexical";

import { CollapsibleContainerNode } from "@/components/editor/nodes/collapsible-container-node";
import { CollapsibleContentNode } from "@/components/editor/nodes/collapsible-content-node";
import { CollapsibleTitleNode } from "@/components/editor/nodes/collapsible-title-node";
import { EquationNode } from "@/components/editor/nodes/equation-node";
import { ImageNode } from "@/components/editor/nodes/image-node";
import { InlineImageNode } from "@/components/editor/nodes/inline-image-node";
import { KeywordNode } from "@/components/editor/nodes/keyword-node";
import { LayoutContainerNode } from "@/components/editor/nodes/layout-container-node";
import { LayoutItemNode } from "@/components/editor/nodes/layout-item-node";
import { PageBreakNode } from "@/components/editor/nodes/page-break-node";

export const nodes: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement> =
  [
    HeadingNode,
    ParagraphNode,
    TextNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    LinkNode,
    OverflowNode,
    HashtagNode,
    CodeNode,
    HorizontalRuleNode,
    PageBreakNode,
    ImageNode,
    InlineImageNode,
    KeywordNode,
    LayoutContainerNode,
    LayoutItemNode,
    EquationNode,
    CollapsibleContainerNode,
    CollapsibleContentNode,
    CollapsibleTitleNode,
    AutoLinkNode,
  ];
